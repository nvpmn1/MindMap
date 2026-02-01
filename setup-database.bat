@echo off
setlocal enabledelayedexpansion

echo.
echo ════════════════════════════════════════════════════════════
echo   🧠 MindMap - Setup do Banco de Dados
echo ════════════════════════════════════════════════════════════
echo.
echo Para completar a configuração, você precisa executar o SQL no Supabase.
echo.
echo OPÇÃO 1 - Forma Automática (Recomendado):
echo ───────────────────────────────────
echo Clique no botão "Setup Database" que aparecerá na aplicação.
echo Aguarde a inicialização automática.
echo.
echo OPÇÃO 2 - Forma Manual:
echo ───────────────────────────────────
echo 1. Abra: https://mvkrlvjyocynmwslklzu.supabase.co
echo 2. Faça login com suas credenciais
echo 3. Vá em: SQL Editor ^> New Query
echo 4. Cole o conteúdo de: database\schema.sql
echo 5. Clique em "Run"
echo.
echo ════════════════════════════════════════════════════════════
echo.
echo Abrindo Supabase Dashboard em 3 segundos...
echo.
timeout /t 3 /nobreak

start https://mvkrlvjyocynmwslklzu.supabase.co/project/mvkrlvjyocynmwslklzu/sql/new

echo.
echo ✅ Dashboard aberto no navegador!
echo.
pause
