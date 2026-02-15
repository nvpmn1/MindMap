import path from 'node:path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function requiredEnv(name) {
  const val = process.env[name];
  if (!val || String(val).trim().length === 0) {
    throw new Error(`Missing required env: ${name}`);
  }
  return val;
}

const supabaseUrl = requiredEnv('SUPABASE_URL');
const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || null;

const defaultWorkspaceId =
  process.env.DEFAULT_WORKSPACE_ID || '11111111-1111-1111-1111-111111111111';

// Must stay in sync with backend/src/auth/fixedAccounts.ts
const FIXED_ACCOUNTS = [
  {
    key: 'guilherme',
    displayName: 'Guilherme Oliveira',
    email: 'gui_oliveira.16@hotmail.com',
    password: 'gui1998',
    color: '#06E5FF',
    workspaceRole: 'admin',
  },
  {
    key: 'helen',
    displayName: 'Helen',
    email: 'helen23m@gmail.com',
    password: 'helen123',
    color: '#06FFD0',
    workspaceRole: 'member',
  },
  {
    key: 'pablo',
    displayName: 'Pablo',
    email: 'pablorfcosta@gmail.com',
    password: 'pablo123',
    color: '#0D99FF',
    workspaceRole: 'member',
  },
];

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const anon = anonKey
  ? createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

async function findUserByEmail(email) {
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`listUsers failed: ${error.message}`);

    const users = data?.users || [];
    const found = users.find((u) => (u.email || '').toLowerCase() === email.toLowerCase());
    if (found) return found;

    if (users.length < perPage) return null;
    page += 1;
  }
}

async function ensureDefaultWorkspace(createdBy) {
  const { data, error } = await admin
    .from('workspaces')
    .select('id')
    .eq('id', defaultWorkspaceId)
    .maybeSingle();
  if (error) throw new Error(`workspace lookup failed: ${error.message}`);
  if (data?.id) return;

  const { error: insertErr } = await admin.from('workspaces').insert({
    id: defaultWorkspaceId,
    name: 'MindLab',
    slug: 'mindlab',
    description: 'Workspace padrao do sistema',
    ...(createdBy ? { created_by: createdBy } : {}),
  });
  if (insertErr) throw new Error(`workspace create failed: ${insertErr.message}`);
}

async function ensureMembership(userId, role) {
  const { error } = await admin.from('workspace_members').upsert(
    {
      workspace_id: defaultWorkspaceId,
      user_id: userId,
      role,
      joined_at: new Date().toISOString(),
    },
    { onConflict: 'workspace_id,user_id' }
  );
  if (error) throw new Error(`membership upsert failed: ${error.message}`);
}

async function ensureProfile(userId, account) {
  const { error } = await admin.from('profiles').upsert(
    {
      id: userId,
      email: account.email.trim().toLowerCase(),
      display_name: account.displayName,
      color: account.color,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );
  if (error) throw new Error(`profile upsert failed (${account.email}): ${error.message}`);
}

async function ensureAuthUser(account) {
  const email = account.email.trim().toLowerCase();
  const existing = await findUserByEmail(email);

  const metadata = {
    full_name: account.displayName,
    color: account.color,
    fixed_account: account.key,
  };

  if (!existing) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: account.password,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error || !data?.user?.id) {
      throw new Error(`createUser failed (${email}): ${error?.message || 'missing user id'}`);
    }
    return data.user.id;
  }

  const { error: updateErr } = await admin.auth.admin.updateUserById(existing.id, {
    password: account.password,
    email_confirm: true,
    user_metadata: { ...(existing.user_metadata || {}), ...metadata },
  });
  if (updateErr) throw new Error(`updateUserById failed (${email}): ${updateErr.message}`);
  return existing.id;
}

async function verifyPasswordLogin(account) {
  if (!anon) return;
  const { data, error } = await anon.auth.signInWithPassword({
    email: account.email.trim().toLowerCase(),
    password: account.password,
  });
  if (error || !data?.session) {
    throw new Error(`signInWithPassword failed (${account.email}): ${error?.message || 'missing session'}`);
  }
  await anon.auth.signOut();
}

async function main() {
  // 1) Ensure auth users + profiles
  const userIdByKey = new Map();

  for (const account of FIXED_ACCOUNTS) {
    const userId = await ensureAuthUser(account);
    userIdByKey.set(account.key, userId);
    await ensureProfile(userId, account);
  }

  // 2) Ensure default workspace exists
  await ensureDefaultWorkspace(userIdByKey.get('guilherme') || null);

  // 3) Ensure membership exists
  for (const account of FIXED_ACCOUNTS) {
    const userId = userIdByKey.get(account.key);
    await ensureMembership(userId, account.workspaceRole);
  }

  // 4) Smoke-test password login (optional, requires anon key)
  for (const account of FIXED_ACCOUNTS) {
    await verifyPasswordLogin(account);
  }

  console.log('OK: fixed accounts provisioned');
  if (!anon) {
    console.log('OK: skipped password-login verification (missing SUPABASE_ANON_KEY/VITE_SUPABASE_ANON_KEY)');
  } else {
    console.log('OK: password-login verification passed');
  }
}

main().catch((err) => {
  console.error('ERROR: failed to provision fixed accounts');
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});

