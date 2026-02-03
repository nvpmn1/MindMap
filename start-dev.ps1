# Local Development Startup Script
# Inicia Frontend + Backend + Banco de dados

Write-Host "🚀 MindMap Hub - Local Development Startup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Colors
$INFO = "Blue"
$SUCCESS = "Green"
$WARN = "Yellow"
$ERROR = "Red"

function Write-Info { Write-Host "ℹ️  $args" -ForegroundColor $INFO }
function Write-Success { Write-Host "✅ $args" -ForegroundColor $SUCCESS }
function Write-Warn { Write-Host "⚠️  $args" -ForegroundColor $WARN }
function Write-Err { Write-Host "❌ $args" -ForegroundColor $ERROR }

# Check Node.js
Write-Info "Verificando Node.js..."
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Err "Node.js não encontrado! Instale de https://nodejs.org"
    exit 1
}
Write-Success "Node.js $(node --version)"

# Check if ports are available
Write-Info "Verificando portas..."
$ports = @{3001 = "Backend"; 5173 = "Frontend"; 54321 = "Supabase"}
$portsOk = $true

foreach ($port in $ports.Keys) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        Write-Warn "Porta $port já está em uso ($($ports[$port]))"
        $portsOk = $false
    }
}

if ($portsOk) {
    Write-Success "Todas as portas estão disponíveis"
} else {
    Write-Warn "Feche as aplicações usando as portas acima"
    Read-Host "Pressione Enter para continuar"
}

Write-Host ""
Write-Host "🔧 Iniciando serviços..." -ForegroundColor Cyan
Write-Host ""

# Start Backend
Write-Info "Iniciando Backend (porta 3001)..."
$backendPath = "C:\Users\gui_o\Desktop\MindMap\backend"
$backendProcess = Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm run dev" -PassThru
Write-Success "Backend iniciado (PID: $($backendProcess.Id))"

# Give backend time to start
Start-Sleep -Seconds 3

# Start Frontend
Write-Info "Iniciando Frontend (porta 5173)..."
$frontendPath = "C:\Users\gui_o\Desktop\MindMap\frontend"
$frontendProcess = Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev" -PassThru
Write-Success "Frontend iniciado (PID: $($frontendProcess.Id))"

Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎉 Todos os serviços estão rodando!" -ForegroundColor Green
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "📍 URLs locais:" -ForegroundColor Cyan
Write-Host "  Frontend:  http://localhost:5173" -ForegroundColor Green
Write-Host "  Backend:   http://localhost:3001" -ForegroundColor Green
Write-Host "  API:       http://localhost:3001/api/v1" -ForegroundColor Green
Write-Host ""

Write-Host "🔐 Health Checks:" -ForegroundColor Cyan
Write-Host "  Backend: http://localhost:3001/api/v1/health" -ForegroundColor Cyan
Write-Host ""

Write-Host "📝 Default Login:" -ForegroundColor Cyan
Write-Host "  Selecione um perfil no login:" -ForegroundColor Cyan
Write-Host "    • Guilherme (@00D9FF)" -ForegroundColor Yellow
Write-Host "    • Helen (@00FFC8)" -ForegroundColor Yellow
Write-Host "    • Pablo (@A78BFA)" -ForegroundColor Yellow
Write-Host ""

Write-Host "🛑 Para parar os serviços:" -ForegroundColor Cyan
Write-Host "  Feche as janelas do PowerShell ou CTRL+C" -ForegroundColor Cyan
Write-Host ""

Write-Host "💡 Dicas:" -ForegroundColor Cyan
Write-Host "  • Hot Reload está ativado - mudanças salvam automaticamente" -ForegroundColor Yellow
Write-Host "  • IA funciona em modo local (não precisa API key)" -ForegroundColor Yellow
Write-Host "  • Dados são salvos no localStorage (teste/demo)" -ForegroundColor Yellow
Write-Host ""

Write-Host "Pressione CTRL+C em qualquer janela para parar" -ForegroundColor Gray
Write-Host ""

# Keep this window open
Write-Host "Essa janela mostra os status dos processos..." -ForegroundColor Gray
$backendProcess | Wait-Process
$frontendProcess | Wait-Process
