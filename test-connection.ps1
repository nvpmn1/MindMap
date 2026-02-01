#!/usr/bin/env pwsh

# Colors
$Green = "`e[32m"
$Red = "`e[31m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

Write-Host ""
Write-Host "$Blue════════════════════════════════════════════════════════════$Reset"
Write-Host "$Blue  🧠 MindMap - Teste de Conexão$Reset"
Write-Host "$Blue════════════════════════════════════════════════════════════$Reset"
Write-Host ""

# Test Backend
Write-Host "$Yellow⏳ Testando Backend (port 3001)...$Reset"
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "$Green✅ Backend respondendo normalmente$Reset"
    }
} catch {
    Write-Host "$Red❌ Backend não respondeu$Reset"
    Write-Host "   Execute: cd backend && npm run dev"
}

# Test Frontend
Write-Host "$Yellow⏳ Testando Frontend (port 5173)...$Reset"
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173/" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "$Green✅ Frontend respondendo normalmente$Reset"
    }
} catch {
    Write-Host "$Red❌ Frontend não respondeu$Reset"
    Write-Host "   Execute: cd frontend && npm run dev"
}

# Test Supabase Connection
Write-Host "$Yellow⏳ Testando Supabase...$Reset"
try {
    $response = Invoke-WebRequest -Uri "https://mvkrlvjyocynmwslklzu.supabase.co/rest/v1/" `
        -Headers @{
            "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12a3Jsdmp5b2N5bm13c2xrbHp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MjYzMTksImV4cCI6MjA4NTMwMjMxOX0.WDM7ZVVoGmi54T3aBGONWhSzgTvWHeS-ZzARg6q4eAc"
        } `
        -UseBasicParsing -TimeoutSec 5
    
    Write-Host "$Green✅ Supabase acessível$Reset"
} catch {
    Write-Host "$Red❌ Supabase não respondeu$Reset"
    Write-Host "   Verifique sua conexão de internet"
}

# Test IA API
Write-Host "$Yellow⏳ Testando IA Claude API...$Reset"
if ($env:ANTHROPIC_API_KEY) {
    Write-Host "$Green✅ Chave Anthropic configurada$Reset"
} else {
    Write-Host "$Red❌ Chave Anthropic não encontrada$Reset"
    Write-Host "   Verifique arquivo backend/.env"
}

Write-Host ""
Write-Host "$Blue════════════════════════════════════════════════════════════$Reset"
Write-Host "$Green✨ Teste concluído!$Reset"
Write-Host ""
Write-Host "URLs de acesso:"
Write-Host "  Frontend: $Blue http://localhost:5173 $Reset"
Write-Host "  Backend:  $Blue http://localhost:3001 $Reset"
Write-Host ""
