@echo off
title Instalador Test Co — AzurTant PRO v1.0.0
color 0E
echo.
echo ╔══════════════════════════════════════════════╗
echo ║   Test Co — AzurTant PRO v1.0.0          ║
echo ║   Instalador One-Click                       ║
echo ╚══════════════════════════════════════════════╝
echo.
echo 🔧 Verificando requisitos...

:: 1. Verificar Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js no encontrado
    echo 📥 Descargando Node.js...
    powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi' -OutFile '%TEMP%\node-installer.msi'"
    msiexec /i "%TEMP%\node-installer.msi" /quiet /norestart
    echo ✅ Node.js instalado
) else (
    echo ✅ Node.js encontrado
)

:: 2. Instalar dependencias
echo 📦 Instalando dependencias...
call npm install --production --no-audit --no-fund 2>nul
echo ✅ Dependencias listas

:: 3. Crear .env si no existe
if not exist .env (
    echo PORT=5182> .env
    echo MODEL=minimax-m3:cloud>> .env
    echo LANG=es-MX>> .env
    echo COMPANY="Test Co">> .env
    echo ✅ Configuración creada
)

:: 4. Registrar como servicio Windows
echo ⚙️ Registrando servicio Windows...
powershell -Command "New-Service -Name 'Test_Co' -BinaryPathName '%CD%\start.bat' -DisplayName 'Test Co - AzurTant PRO' -Description 'Sistema multi-agente de IA' -StartupType Automatic" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Servicio registrado (inicio automático)
) else (
    echo ⚠️ El servicio ya existe o se iniciará manualmente
)

:: 5. Iniciar sistema
echo.
echo 🚀 INICIANDO Test Co...
echo    URL: http://localhost:5182
echo.
start http://localhost:5182
node server.mjs

pause
