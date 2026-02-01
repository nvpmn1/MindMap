@echo off
REM Deploy Helper Script para Render e Vercel
REM Este script testa a conectividade e mostra status dos serviços

echo.
echo ======================================================
echo    MindMap Platform - Deploy Status Checker
echo ======================================================
echo.

REM Teste Local
echo [1/4] Testando Backend Local...
curl -s http://localhost:3001/health > nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Backend Local: ONLINE (port 3001)
) else (
    echo ✗ Backend Local: OFFLINE
)

echo.
echo [2/4] Testando Frontend Local...
curl -s http://localhost:5173 > nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Frontend Local: ONLINE (port 5173)
) else (
    echo ✗ Frontend Local: OFFLINE
)

REM Teste Production
echo.
echo [3/4] Testando Backend Production (Render)...
curl -s https://mindmap-api.onrender.com/health > nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Backend Production: ONLINE
) else (
    echo ✗ Backend Production: OFFLINE or not deployed
)

echo.
echo [4/4] Testando Frontend Production (Vercel)...
curl -s https://mind-map-three-blue.vercel.app > nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Frontend Production: ONLINE
) else (
    echo ✗ Frontend Production: OFFLINE or not deployed
)

echo.
echo ======================================================
echo.
echo PRÓXIMOS PASSOS:
echo.
echo 1. Se ambos os serviços de PROD estão OFFLINE:
echo    - Acesse https://dashboard.render.com
echo    - Configure as variáveis de ambiente
echo    - Clique em Manual Deploy
echo.
echo 2. Se Frontend está OFFLINE:
echo    - Acesse https://vercel.com/dashboard
echo    - Verifique Build Settings
echo    - Faça um novo commit: git push origin main
echo.
echo 3. Para mais detalhes, veja: DEPLOY_RENDER_VERCEL.md
echo.
pause
