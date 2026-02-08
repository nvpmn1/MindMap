# ============================================
# SCRIPT DE SETUP COMPLETO DO MINDMAP
# ============================================
# Este script automatiza o setup do banco de dados
# Execute como: .\setup-database.ps1

Write-Host "" -ForegroundColor Green
Write-Host "    ██╗  ██╗██╗██╗  ██╗██╗  ██╗" -ForegroundColor Cyan
Write-Host "    ╚██╗██╔╝██║██║  ██║██║ ██╔╝" -ForegroundColor Cyan
Write-Host "     ╚███╔╝ ██║███████║█████╔╝ " -ForegroundColor Cyan
Write-Host "     ██╔██╗ ██║██╔══██║██╔═██╗ " -ForegroundColor Cyan
Write-Host "    ██╔╝ ██╗██║██║  ██║██║  ██╗" -ForegroundColor Cyan
Write-Host "    ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝" -ForegroundColor Cyan
Write-Host "" -ForegroundColor Green
Write-Host "   🚀 MindMap Hub - Database Setup" -ForegroundColor Yellow
Write-Host "" -ForegroundColor Green

# Verificar .env
$backendEnv = "C:\Users\gui_o\Desktop\MindMap\backend\.env"
if (-not (Test-Path $backendEnv)) {
    Write-Host "❌ Arquivo .env não encontrado em backend/" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Arquivo .env encontrado" -ForegroundColor Green

# Extrair credenciais (sem exposição)
$envContent = Get-Content $backendEnv -Raw
if ($envContent -match "SUPABASE_URL=(.+?)(?:\r?\n|$)") {
    $supabaseUrl = $Matches[1].Trim()
    Write-Host "✅ SUPABASE_URL configurado" -ForegroundColor Green
} else {
    Write-Host "❌ SUPABASE_URL não encontrado em .env" -ForegroundColor Red
    exit 1
}

if ($envContent -match "SUPABASE_SERVICE_ROLE_KEY=(.+?)(?:\r?\n|$)") {
    $serviceRoleKey = $Matches[1].Trim()
    Write-Host "✅ SUPABASE_SERVICE_ROLE_KEY configurado" -ForegroundColor Green
} else {
    Write-Host "❌ SUPABASE_SERVICE_ROLE_KEY não encontrado em .env" -ForegroundColor Red
    Write-Host "" -ForegroundColor Yellow
    Write-Host "📋 Para adicionar, abra backend/.env e adicione:" -ForegroundColor Yellow
    Write-Host "   SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE" -ForegroundColor Gray
    Write-Host "" -ForegroundColor Yellow
    exit 1
}

Write-Host "" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "" -ForegroundColor Green

Write-Host "📊 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "" -ForegroundColor Green

Write-Host "1️⃣  Abra Supabase Console" -ForegroundColor Cyan
Write-Host "   🔗 https://app.supabase.com/" -ForegroundColor Gray
Write-Host "" -ForegroundColor Green

Write-Host "2️⃣  Vá para SQL Editor" -ForegroundColor Cyan
Write-Host "   Selecione seu projeto → SQL Editor" -ForegroundColor Gray
Write-Host "" -ForegroundColor Green

Write-Host "3️⃣  Copie e execute este arquivo:" -ForegroundColor Cyan
$setupFile = "C:\Users\gui_o\Desktop\MindMap\database\setup-complete.sql"
Write-Host "   📄 $setupFile" -ForegroundColor Gray
Write-Host "" -ForegroundColor Green

Write-Host "4️⃣  Cole TODO o conteúdo do arquivo no SQL Editor do Supabase" -ForegroundColor Cyan
Write-Host "   ✂️  Copie tudo (Ctrl+A no arquivo .sql)" -ForegroundColor Gray
Write-Host "   📋 Cole no Supabase SQL Editor" -ForegroundColor Gray
Write-Host "   ▶️  Clique em 'Run' ou pressione Ctrl+Enter" -ForegroundColor Gray
Write-Host "" -ForegroundColor Green

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "" -ForegroundColor Green

Write-Host "⏱️  Tempo estimado: 30 segundos" -ForegroundColor Yellow
Write-Host "" -ForegroundColor Green

Write-Host "📝 O que será feito:" -ForegroundColor Cyan
Write-Host "   ✓ Limpeza completa das tabelas antigas" -ForegroundColor Gray
Write-Host "   ✓ Criação do schema novo e correto" -ForegroundColor Gray
Write-Host "   ✓ Criação da workspace padrão 'MindLab'" -ForegroundColor Gray
Write-Host "   ✓ Configuração de triggers e funções" -ForegroundColor Gray
Write-Host "   ✓ Desabilitação de RLS (seu backend acessa tudo)" -ForegroundColor Gray
Write-Host "" -ForegroundColor Green

Write-Host "🎯 Após executar no Supabase:" -ForegroundColor Yellow
Write-Host "   1. Volte ao terminal e rode: npm run dev" -ForegroundColor Gray
Write-Host "   2. Abra http://localhost:5173" -ForegroundColor Gray
Write-Host "   3. Pronto! Tudo deve funcionar 🚀" -ForegroundColor Gray
Write-Host "" -ForegroundColor Green

Write-Host "❓ Dúvidas?" -ForegroundColor Yellow
Write-Host "   • Certifique-se que está no projeto correto no Supabase" -ForegroundColor Gray
Write-Host "   • Se der erro, veja se já rodou uma vez (pode ter conflitos)" -ForegroundColor Gray
Write-Host "   • Todos os erros começam com 'ERROR:'" -ForegroundColor Gray
Write-Host "" -ForegroundColor Green

# Tentar abrir o arquivo SQL automaticamente
Write-Host "🔄 Abrindo arquivo SQL..." -ForegroundColor Cyan
Start-Process -FilePath $setupFile

Write-Host "" -ForegroundColor Green
Write-Host "✅ Setup pronto! Confira o arquivo que foi aberto." -ForegroundColor Green
Write-Host "" -ForegroundColor Green
