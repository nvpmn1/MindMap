import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function loadDotEnvIfPresent() {
  const envPath = path.join(process.cwd(), '.env');

  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, 'utf-8');
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const eqIndex = trimmed.indexOf('=');

    if (eqIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, eqIndex).trim();
    const rawValue = trimmed.slice(eqIndex + 1).trim();
    const unquotedValue = rawValue.replace(/^['"]|['"]$/g, '');

    if (!(key in process.env)) {
      process.env[key] = unquotedValue;
    }
  }
}

loadDotEnvIfPresent();

const backupDir = process.env.BACKUP_DIR || path.join(process.cwd(), '.reports', 'backups');
const sourceDbUrl = process.env.SUPABASE_DB_URL;
const restoreDbUrl = process.env.SUPABASE_RESTORE_DB_URL;

const defaultWinPgBin = 'C:\\Program Files\\PostgreSQL\\17\\bin';

function resolveBinary(command) {
  if (process.platform === 'win32') {
    const configuredBin = process.env.PG_BIN_DIR || defaultWinPgBin;
    const configuredPath = path.join(configuredBin, `${command}.exe`);

    if (fs.existsSync(configuredPath)) {
      return configuredPath;
    }
  }

  return command;
}

function checkBinary(command, args = ['--version']) {
  const resolved = resolveBinary(command);
  const result = spawnSync(resolved, args, {
    shell: false,
    encoding: 'utf-8',
  });

  return {
    ok: result.status === 0,
    command: resolved,
    output: (result.stdout || result.stderr || '').trim(),
  };
}

function print(title, value) {
  console.log(`${title}: ${value}`);
}

function isValidPostgresUrl(value) {
  if (!value) {
    return false;
  }

  if (
    value.includes('<') ||
    value.includes('>') ||
    value.includes('[') ||
    value.includes(']') ||
    value.toUpperCase().includes('YOUR-PASSWORD')
  ) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === 'postgresql:' || parsed.protocol === 'postgres:';
  } catch {
    return false;
  }
}

function main() {
  console.log('🔎 Supabase Backup/Restore Drill - Preflight');

  fs.mkdirSync(backupDir, { recursive: true });

  const pgDump = checkBinary('pg_dump');
  const psql = checkBinary('psql');
  const pgRestore = checkBinary('pg_restore');
  const hasValidSourceDbUrl = isValidPostgresUrl(sourceDbUrl);
  const hasValidRestoreDbUrl = isValidPostgresUrl(restoreDbUrl);

  print('Backup directory', backupDir);
  print('SUPABASE_DB_URL configured', hasValidSourceDbUrl ? 'yes' : 'no');
  print('SUPABASE_RESTORE_DB_URL configured', hasValidRestoreDbUrl ? 'yes' : 'no');
  print('pg_dump available', pgDump.ok ? 'yes' : 'no');
  print('pg_dump command', pgDump.command);
  print('psql available', psql.ok ? 'yes' : 'no');
  print('psql command', psql.command);
  print('pg_restore available', pgRestore.ok ? 'yes' : 'no');
  print('pg_restore command', pgRestore.command);

  if (!pgDump.ok || !psql.ok || !pgRestore.ok) {
    console.log('\n❌ Missing required PostgreSQL CLI tools.');
    if (process.platform === 'win32') {
      console.log(
        'Tip (Windows): install PostgreSQL 17 and/or set PG_BIN_DIR="C:\\Program Files\\PostgreSQL\\17\\bin".'
      );
    } else {
      console.log('Install PostgreSQL client tools and retry.');
    }
    process.exit(1);
  }

  if (!hasValidSourceDbUrl) {
    console.log('\n❌ SUPABASE_DB_URL is missing or invalid.');
    console.log('Expected format: postgresql://USER:PASSWORD@HOST:5432/postgres');
    process.exit(1);
  }

  console.log('\n✅ Preflight passed. Suggested next commands:');
  console.log('1) Generate backup:');
  console.log(
    '   pg_dump --format=custom --no-owner --no-privileges --dbname "$SUPABASE_DB_URL" --file "./.reports/backups/mindmap-backup-<timestamp>.dump"'
  );

  if (hasValidRestoreDbUrl) {
    console.log('2) Restore into staging target:');
    console.log(
      '   pg_restore --no-owner --no-privileges --clean --if-exists --dbname "$SUPABASE_RESTORE_DB_URL" "./.reports/backups/mindmap-backup-<timestamp>.dump"'
    );
  } else {
    console.log('2) Configure SUPABASE_RESTORE_DB_URL to validate restore end-to-end.');
  }

  console.log('3) Validate with smoke + E2E critical flow.');
}

main();
