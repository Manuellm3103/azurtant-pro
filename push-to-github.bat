@echo off
REM =====================================================
REM AzurTant PRO v9.0.0 - Push a GitHub
REM =====================================================
REM Manuel: corre este script después de generar tu token
REM en https://github.com/settings/tokens (Classic, scope repo)
REM =====================================================

setlocal enabledelayedexpansion

echo.
echo =====================================================
echo  AzurTant PRO v9.0.0 - Push a GitHub
echo =====================================================
echo.

REM 1. Pedir token
set /p TOKEN="Pega tu GitHub token (no se guarda, solo en memoria): "

if "%TOKEN%"=="" (
    echo [ERROR] No pegaste token
    pause
    exit /b 1
)

REM 2. Configurar remote
cd /d "%~dp0"
git remote remove origin >nul 2>&1
git remote add origin https://%TOKEN%@github.com/Manuellm3103/azurtant-pro.git

REM 3. Push
echo.
echo [INFO] Pusheando codigo a GitHub...
git push -u origin main --force

if %errorlevel%==0 (
    echo.
    echo =====================================================
    echo  [OK] Push exitoso!
    echo  https://github.com/Manuellm3103/azurtant-pro
    echo =====================================================
) else (
    echo.
    echo [ERROR] Push fallo. Posibles causas:
    echo  - Token invalido o expirado
    echo  - Token sin scope 'repo'
    echo  - Repositorio bloqueado por secretos (GH013)
    echo  - Revisa: https://github.com/Manuellm3103/azurtant-pro
)

REM 4. Limpiar remote con token
git remote remove origin >nul 2>&1
git remote add origin https://github.com/Manuellm3103/azurtant-pro.git

echo.
pause
