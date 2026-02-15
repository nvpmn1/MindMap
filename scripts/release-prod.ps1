param(
  [string]$SmokeFrontendUrl = "https://mindmap-hub.vercel.app",
  [string]$SmokeBackendUrl  = "https://mindmap-hub-api.onrender.com",
  [string]$SmokeUserEmail   = "gui_oliveira.16@hotmail.com",
  [string]$SmokeUserPassword = "gui1998",
  [switch]$ApplyHardening,
  [switch]$DoGit,
  [string]$TagName = "",
  [switch]$ConfigureGitHubSecrets
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Warn($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg)  { Write-Host "[ERR ] $msg" -ForegroundColor Red }

$repoRoot = (Resolve-Path ".").Path
Write-Info "Repo: $repoRoot"

# 1) Quality gate
Write-Info "Running quality gate..."
npm run quality:gate

# 2) Smoke public
Write-Info "Running smoke public (prod)..."
$env:SMOKE_FRONTEND_URL = $SmokeFrontendUrl
$env:SMOKE_BACKEND_URL  = $SmokeBackendUrl

npm run env:check:smoke:public
npm run smoke:deploy

# 3) Smoke authenticated (prod) via password login (more reliable than refresh tokens in CI)
Write-Info "Preparing authenticated smoke (prod) using SMOKE_USER_EMAIL/SMOKE_USER_PASSWORD..."

# Load .env into this session (for SUPABASE_URL and SUPABASE_ANON_KEY)
Get-Content ".\\.env" | ForEach-Object {
  if ($_ -match '^[A-Za-z_][A-Za-z0-9_]*=') {
    $k, $v = $_ -split '=', 2
    if ($k -in @("SUPABASE_URL","SUPABASE_ANON_KEY")) {
      Set-Item -Path "Env:$k" -Value $v
    }
  }
}

if (-not $env:SUPABASE_URL) { throw "SUPABASE_URL missing in .env" }
if (-not $env:SUPABASE_ANON_KEY) { throw "SUPABASE_ANON_KEY missing in .env" }

$env:SMOKE_USER_EMAIL = $SmokeUserEmail
$env:SMOKE_USER_PASSWORD = $SmokeUserPassword
$env:SMOKE_SUPABASE_URL = $env:SUPABASE_URL
$env:SMOKE_SUPABASE_ANON_KEY = $env:SUPABASE_ANON_KEY

# Ensure urls are the ones requested
$env:SMOKE_FRONTEND_URL = $SmokeFrontendUrl
$env:SMOKE_BACKEND_URL  = $SmokeBackendUrl

Write-Info "Running smoke authenticated (prod)..."
npm run env:check:smoke:auth
npm run smoke:deploy

# 4) Backup dump before DB changes (baseline artifact, local-only)
Write-Info "Creating Supabase backup dump (local-only)..."
if (!(Test-Path ".\.reports\backups")) { New-Item -ItemType Directory -Force -Path ".\.reports\backups" | Out-Null }

# Load .env into this session (for SUPABASE_DB_URL and BACKUP_DIR)
Get-Content ".\.env" | ForEach-Object {
  if ($_ -match '^[A-Za-z_][A-Za-z0-9_]*=') {
    $k, $v = $_ -split '=', 2
    if ($k -in @("SUPABASE_DB_URL","BACKUP_DIR")) {
      Set-Item -Path "Env:$k" -Value $v
    }
  }
}

if (-not $env:SUPABASE_DB_URL) { throw "SUPABASE_DB_URL missing in .env" }

$backupDir = if ($env:BACKUP_DIR) { $env:BACKUP_DIR } else { ".reports/backups" }
if (!(Test-Path $backupDir)) { New-Item -ItemType Directory -Force -Path $backupDir | Out-Null }

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$dumpFile = Join-Path (Resolve-Path $backupDir).Path ("mindmap-prod-" + $stamp + ".dump")

$pgDump = "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe"
if (!(Test-Path $pgDump)) { throw "pg_dump not found at: $pgDump" }

& $pgDump --format=custom --no-owner --no-privileges --dbname "$env:SUPABASE_DB_URL" --file "$dumpFile"
Write-Info "Backup dump created: $dumpFile"

# 5) Apply hardening SQL (optional)
if ($ApplyHardening) {
  Write-Info "Applying DB hardening SQL..."
  $psql = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
  if (!(Test-Path $psql)) { throw "psql not found at: $psql" }
  & $psql "$env:SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f ".\database\3_save_integrity_hardening.sql"
  Write-Info "DB hardening applied."
} else {
  Write-Info "Skipping DB hardening (not requested)."
}

# 6) Configure GitHub Secrets/Variables (optional; requires gh + a token that can edit secrets)
if ($ConfigureGitHubSecrets) {
  Write-Info "Configuring GitHub repo Variables/Secrets for production-smoke (optional)..."
  $ghExe = "C:\Program Files\GitHub CLI\gh.exe"
  if (!(Test-Path $ghExe)) { throw "gh not found at: $ghExe" }

  # Try to get GH_TOKEN from git credential helper (must have repo admin rights).
  $repo = "nvpmn1/MindMap"
  $payload = "protocol=https`nhost=github.com`npath=$repo`n`n"
  $cred = $payload | git credential fill 2>$null
  if (-not $cred) { throw "No git credential available for github.com/$repo" }
  $token = ""
  foreach ($line in ($cred -split "`n")) {
    if ($line -like "password=*") { $token = $line.Substring(9) }
  }
  if (-not $token) { throw "Git credential token missing" }

  $env:GH_TOKEN = $token

  & $ghExe variable set SMOKE_FRONTEND_URL --repo $repo --body $SmokeFrontendUrl | Out-Null
  & $ghExe variable set SMOKE_BACKEND_URL  --repo $repo --body $SmokeBackendUrl  | Out-Null
  if ($env:SMOKE_SUPABASE_URL) {
    & $ghExe variable set SMOKE_SUPABASE_URL --repo $repo --body $env:SMOKE_SUPABASE_URL | Out-Null
  }
  if ($env:SMOKE_SUPABASE_ANON_KEY) {
    & $ghExe variable set SMOKE_SUPABASE_ANON_KEY --repo $repo --body $env:SMOKE_SUPABASE_ANON_KEY | Out-Null
  }
  if ($env:SMOKE_WORKSPACE_ID) {
    & $ghExe variable set SMOKE_WORKSPACE_ID --repo $repo --body $env:SMOKE_WORKSPACE_ID | Out-Null
  }
  if ($env:SMOKE_USER_EMAIL) {
    $env:SMOKE_USER_EMAIL | & $ghExe secret set SMOKE_USER_EMAIL --repo $repo | Out-Null
  }
  if ($env:SMOKE_USER_PASSWORD) {
    $env:SMOKE_USER_PASSWORD | & $ghExe secret set SMOKE_USER_PASSWORD --repo $repo | Out-Null
  }

  # Backwards compat: still set refresh token if present.
  if ($env:SMOKE_REFRESH_TOKEN) {
    $env:SMOKE_REFRESH_TOKEN | & $ghExe secret set SMOKE_REFRESH_TOKEN --repo $repo | Out-Null
  }
  Write-Info "GitHub secrets/variables updated."
} else {
  Write-Info "Skipping GitHub secrets/variables config (not requested)."
}

# 7) Git baseline (optional)
if ($DoGit) {
  Write-Info "Creating git commit+tag+push (optional)..."

  git status
  git add .

  $msg = "chore(prod): release baseline"
  git commit -m $msg

  if (-not $TagName -or $TagName.Trim().Length -eq 0) {
    $TagName = "prod-baseline-" + (Get-Date -Format "yyyyMMdd")
  }
  $tagMsg = "Production baseline " + (Get-Date -Format "yyyy-MM-dd")

  git tag -a $TagName -m $tagMsg
  git push origin main
  git push origin $TagName

  Write-Info "Git baseline complete: tag=$TagName"
} else {
  Write-Info "Skipping git commit/tag/push (not requested)."
}

Write-Info "Release flow completed successfully."
