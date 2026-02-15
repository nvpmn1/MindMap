import path from 'node:path';
import fs from 'node:fs';
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

const supabaseUrl = process.env.SMOKE_SUPABASE_URL || requiredEnv('SUPABASE_URL');
const anonKey = process.env.SMOKE_SUPABASE_ANON_KEY || requiredEnv('SUPABASE_ANON_KEY');

const defaultWorkspaceId =
  process.env.DEFAULT_WORKSPACE_ID || '11111111-1111-1111-1111-111111111111';

// Fixed-accounts mode: generate tokens for an allowed account (default: admin).
const smokeEmail = process.env.SMOKE_USER_EMAIL || 'gui_oliveira.16@hotmail.com';
const smokePassword = process.env.SMOKE_USER_PASSWORD || 'gui1998';

const smokeFrontendUrl = process.env.SMOKE_FRONTEND_URL || 'https://mindmap-hub.vercel.app';
const smokeBackendUrl = process.env.SMOKE_BACKEND_URL || 'https://mindmap-hub-api.onrender.com';

const anon = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
});

async function main() {
  const { data, error } = await anon.auth.signInWithPassword({
    email: String(smokeEmail).trim().toLowerCase(),
    password: String(smokePassword),
  });

  if (error || !data?.session?.refresh_token || !data?.session?.access_token) {
    throw new Error(`signInWithPassword failed: ${error?.message || 'missing tokens'}`);
  }

  const refreshToken = data.session.refresh_token;
  const accessToken = data.session.access_token;
  const userId = data.session.user?.id || '';

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
  console.log(`OK: smoke user ${smokeEmail} (${userId || 'unknown'}) in workspace ${defaultWorkspaceId}`);
  console.log(`OK: refresh token masked: ${masked}`);
}

main().catch((err) => {
  console.error('ERROR: failed to generate SMOKE_REFRESH_TOKEN');
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});

