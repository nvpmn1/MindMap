import { supabaseAdmin } from '../services/supabase';
import { env } from '../utils/env';
import { logger } from '../utils/logger';
import { FIXED_ACCOUNTS, type FixedAccount } from './fixedAccounts';

type AdminUser = { id: string; email?: string | null; user_metadata?: Record<string, unknown> };

async function listUsersSafe(): Promise<AdminUser[]> {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) {
    throw new Error(`Failed to list users: ${error.message}`);
  }
  const users = (data?.users ?? []) as unknown as AdminUser[];
  return users.map((u) => ({
    id: String(u.id),
    email: u.email ?? null,
    user_metadata: (u.user_metadata || {}) as Record<string, unknown>,
  }));
}

async function ensureAuthUser(account: FixedAccount, existingUsers: AdminUser[]): Promise<string> {
  const normalizedEmail = account.email.trim().toLowerCase();
  const existing = existingUsers.find((u) => (u.email || '').toLowerCase() === normalizedEmail);

  if (!existing) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: account.password,
      email_confirm: true,
      user_metadata: {
        full_name: account.displayName,
        color: account.color,
        fixed_account: account.key,
      },
    });

    if (error || !data?.user?.id) {
      throw new Error(`Failed to create fixed user ${normalizedEmail}: ${error?.message || 'Unknown error'}`);
    }

    logger.info({ userId: data.user.id, email: normalizedEmail }, '[Auth] Fixed user created');
    return String(data.user.id);
  }

  // Keep the password fixed (as requested) and ensure metadata is consistent.
  const nextMetadata = {
    ...(existing.user_metadata || {}),
    full_name: account.displayName,
    color: account.color,
    fixed_account: account.key,
  };

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
    password: account.password,
    user_metadata: nextMetadata,
  });

  if (updateError) {
    throw new Error(`Failed to update fixed user ${normalizedEmail}: ${updateError.message}`);
  }

  logger.info({ userId: existing.id, email: normalizedEmail }, '[Auth] Fixed user verified/updated');
  return String(existing.id);
}

async function ensureProfile(userId: string, account: FixedAccount): Promise<void> {
  const payload: any = {
    id: userId,
    email: account.email.trim().toLowerCase(),
    display_name: account.displayName,
    color: account.color,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin.from('profiles').upsert(payload, { onConflict: 'id' });
  if (error) {
    throw new Error(`Failed to upsert profile for ${account.email}: ${error.message}`);
  }
}

async function ensureDefaultWorkspace(createdBy: string | null): Promise<void> {
  const { data: existing, error: lookupError } = await supabaseAdmin
    .from('workspaces')
    .select('id, created_by')
    .eq('id', env.DEFAULT_WORKSPACE_ID)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`Failed to lookup default workspace: ${lookupError.message}`);
  }

  if (!existing) {
    const { error: insertError } = await supabaseAdmin.from('workspaces').insert({
      id: env.DEFAULT_WORKSPACE_ID,
      name: 'MindLab',
      slug: 'mindlab',
      description: 'Workspace padrão',
      ...(createdBy ? { created_by: createdBy } : {}),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (insertError) {
      throw new Error(`Failed to create default workspace: ${insertError.message}`);
    }

    logger.info({ workspaceId: env.DEFAULT_WORKSPACE_ID }, '[Auth] Default workspace ensured');
    return;
  }

  // Backfill created_by for nicer metadata (optional).
  if (!existing.created_by && createdBy) {
    await supabaseAdmin
      .from('workspaces')
      .update({ created_by: createdBy, updated_at: new Date().toISOString() })
      .eq('id', env.DEFAULT_WORKSPACE_ID);
  }
}

async function ensureMembership(userId: string, account: FixedAccount): Promise<void> {
  const { data: membership, error: lookupError } = await supabaseAdmin
    .from('workspace_members')
    .select('id, role')
    .eq('workspace_id', env.DEFAULT_WORKSPACE_ID)
    .eq('user_id', userId)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`Failed to lookup membership for ${account.email}: ${lookupError.message}`);
  }

  if (!membership) {
    const { error: insertError } = await supabaseAdmin.from('workspace_members').insert({
      workspace_id: env.DEFAULT_WORKSPACE_ID,
      user_id: userId,
      role: account.workspaceRole,
      joined_at: new Date().toISOString(),
    });

    if (insertError) {
      throw new Error(`Failed to create membership for ${account.email}: ${insertError.message}`);
    }
    return;
  }

  if (membership.role !== account.workspaceRole) {
    const { error: updateError } = await supabaseAdmin
      .from('workspace_members')
      .update({ role: account.workspaceRole })
      .eq('id', membership.id);

    if (updateError) {
      throw new Error(`Failed to update membership role for ${account.email}: ${updateError.message}`);
    }
  }
}

export async function provisionFixedAccounts(): Promise<void> {
  // Provision is best-effort in development. If it fails, auth might not work,
  // but we still want the API to start for debugging.
  try {
    const existingUsers = await listUsersSafe();

    const userIdByKey = new Map<string, string>();

    for (const account of FIXED_ACCOUNTS) {
      const userId = await ensureAuthUser(account, existingUsers);
      userIdByKey.set(account.key, userId);
      await ensureProfile(userId, account);
    }

    const createdBy = userIdByKey.get('guilherme') || null;
    await ensureDefaultWorkspace(createdBy);

    for (const account of FIXED_ACCOUNTS) {
      const userId = userIdByKey.get(account.key);
      if (!userId) {
        continue;
      }
      await ensureMembership(userId, account);
    }

    logger.info(
      {
        accounts: FIXED_ACCOUNTS.map((a) => ({ key: a.key, email: a.email, role: a.workspaceRole })),
      },
      '[Auth] Fixed accounts provisioned'
    );
  } catch (error) {
    logger.error({ error }, '[Auth] Failed to provision fixed accounts');
  }
}
