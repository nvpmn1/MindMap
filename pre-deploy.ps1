# ========================================
# Pre-Deploy Script - MindMap Hub
# ========================================
# Verifica se tudo está pronto para deploy

Write-Host "🚀 MindMap Hub - Pre-Deploy Check" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# Check if git is clean
Write-Host "📋 Checking git status..." -ForegroundColor Blue
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "⚠️  You have uncommitted changes!" -ForegroundColor Yellow
    Write-Host "Files changed:" -ForegroundColor Yellow
    git status --short
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne "y") {
        Write-Host "❌ Aborted" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Git status checked" -ForegroundColor Green
Write-Host ""

# Check if .env files exist
Write-Host "📋 Checking environment files..." -ForegroundColor Blue
if (!(Test-Path "backend\.env")) {
    Write-Host "❌ backend\.env not found!" -ForegroundColor Red
    exit 1
}
if (!(Test-Path "frontend\.env.local")) {
    Write-Host "❌ frontend\.env.local not found!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Environment files OK" -ForegroundColor Green
Write-Host ""

# Test backend build
Write-Host "🏗️  Building backend..." -ForegroundColor Blue
Push-Location backend
try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Backend build failed"
    }
    Write-Host "✅ Backend build successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend build failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
Write-Host ""

# Test frontend build
Write-Host "🏗️  Building frontend..." -ForegroundColor Blue
Push-Location frontend
try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Frontend build failed"
    }
    Write-Host "✅ Frontend build successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend build failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
Write-Host ""

# Summary
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "✅ ALL CHECKS PASSED!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Commit your changes: git add . && git commit -m 'chore: prepare for deploy'" -ForegroundColor White
Write-Host "2. Push to GitHub: git push origin main" -ForegroundColor White
Write-Host "3. Deploy backend on Render: https://dashboard.render.com" -ForegroundColor White
Write-Host "4. Deploy frontend on Vercel: https://vercel.com/dashboard" -ForegroundColor White
Write-Host ""
Write-Host "📖 Read DEPLOY.md for detailed instructions" -ForegroundColor Cyan
