import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
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
const anonKey = requiredEnv('SUPABASE_ANON_KEY');

const defaultWorkspaceId =
  process.env.DEFAULT_WORKSPACE_ID || '11111111-1111-1111-1111-111111111111';

const smokeEmail = process.env.SMOKE_USER_EMAIL || 'smoke.runner@mindmap.local';
const smokeDisplayName = process.env.SMOKE_USER_NAME || 'Smoke Runner';
const smokeColor = process.env.SMOKE_USER_COLOR || '#00D9FF';

const smokeFrontendUrl = process.env.SMOKE_FRONTEND_URL || 'https://mindmap-hub.vercel.app';
const smokeBackendUrl = process.env.SMOKE_BACKEND_URL || 'https://mindmap-hub-api.onrender.com';

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const anon = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserIdByEmail(email) {
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`listUsers failed: ${error.message}`);

    const users = data?.users || [];
    const found = users.find((u) => (u.email || '').toLowerCase() === email.toLowerCase());
    if (found) return found.id;

    if (users.length < perPage) return null;
    page += 1;
  }
}

async function ensureWorkspace(workspaceId) {
  const { data, error } = await admin
    .from('workspaces')
    .select('id')
    .eq('id', workspaceId)
    .maybeSingle();
  if (error) throw new Error(`Workspace query failed: ${error.message}`);
  if (data?.id) return;

  const { error: insertErr } = await admin.from('workspaces').insert({
    id: workspaceId,
    name: 'MindLab',
    slug: 'mindlab',
    description: 'Workspace padrao do sistema',
  });
  if (insertErr) throw new Error(`Workspace create failed: ${insertErr.message}`);
}

async function main() {
  await ensureWorkspace(defaultWorkspaceId);

  // Rotate password every time we generate a new refresh token.
  const password = `Smk!${crypto.randomBytes(10).toString('hex')}A9`;

  let userId = await findUserIdByEmail(smokeEmail);
  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email: smokeEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: smokeDisplayName },
    });
    if (error || !data?.user?.id) {
      throw new Error(`createUser failed: ${error?.message || 'missing user id'}`);
    }
    userId = data.user.id;
  } else {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      user_metadata: { full_name: smokeDisplayName },
    });
    if (error) throw new Error(`updateUserById failed: ${error.message}`);
  }

  await admin.from('profiles').upsert({
    id: userId,
    email: smokeEmail,
    display_name: smokeDisplayName,
    color: smokeColor,
  });

  await admin.from('workspace_members').upsert({
    workspace_id: defaultWorkspaceId,
    user_id: userId,
    role: 'admin',
  });

  const { data: signInData, error: signInErr } = await anon.auth.signInWithPassword({
    email: smokeEmail,
    password,
  });
  if (signInErr || !signInData?.session?.refresh_token || !signInData?.session?.access_token) {
    throw new Error(`signInWithPassword failed: ${signInErr?.message || 'missing tokens'}`);
  }

  const refreshToken = signInData.session.refresh_token;
  const accessToken = signInData.session.access_token;

  const outDir = path.resolve(process.cwd(), '.reports', 'run');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'smoke-auth.env');

  // Keep file local-only. Never commit it (repo .gitignore covers .reports/run).
  const content = [
    `SMOKE_FRONTEND_URL=${smokeFrontendUrl}`,
    `SMOKE_BACKEND_URL=${smokeBackendUrl}`,
    `SMOKE_REFRESH_TOKEN=${refreshToken}`,
    `SMOKE_BEARER_TOKEN=${accessToken}`,
    `SMOKE_WORKSPACE_ID=${defaultWorkspaceId}`,
    `SMOKE_USER_EMAIL=${smokeEmail}`,
    `SMOKE_USER_ID=${userId}`,
    `SMOKE_GENERATED_AT=${new Date().toISOString()}`,
  ].join('\n');

  fs.writeFileSync(outFile, `${content}\n`, { encoding: 'utf8' });

  const masked = `${refreshToken.slice(0, 6)}...${refreshToken.slice(-4)}`;
  console.log(`OK: wrote ${path.relative(process.cwd(), outFile)}`);
  console.log(`OK: smoke user ${smokeEmail} (${userId}) in workspace ${defaultWorkspaceId}`);
  console.log(`OK: refresh token masked: ${masked}`);
}

main().catch((err) => {
  console.error('ERROR: failed to generate SMOKE_REFRESH_TOKEN');
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});

