@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo    SINCRONIZACAO MANUAL
echo ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js nao foi encontrado no PATH.
    echo Instale o Node.js 18 ou superior e tente novamente.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo ERRO: Dependencias nao encontradas.
    echo Execute npm install na pasta sincronizacao antes de continuar.
    pause
    exit /b 1
)

node manual-sync.js
set "EXIT_CODE=%errorlevel%"

echo.
if "%EXIT_CODE%"=="0" (
    echo Sincronizacao concluida com sucesso.
) else (
    echo A sincronizacao terminou com erro. Codigo: %EXIT_CODE%
)

pause
exit /b %EXIT_CODE%
