@echo off
REM AzurTant PRO v9 Startup — Node.js + Watchdog
REM Mata EXE viejo (si existe), arranca server Node.js, monta watchdog

set PORT=5182
set APPDIR=C:\Users\Manu\azurant-app\AzurTantPRO_v7_Package

echo === AzurTant PRO v9 Startup ===

REM 1. Matar cualquier proceso en :5182 (EXE viejo o nodo previo)
echo [1/4] Liberando puerto %PORT%...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PORT%" ^| findstr LISTENING') do (
  echo   Kill PID %%a
  taskkill /F /PID %%a >nul 2>&1
)

REM 2. Verificar bun/node
echo [2/4] Verificando runtime...
where bun >nul 2>&1
if %errorlevel%==0 (
  set RUNTIME=bun
) else (
  where node >nul 2>&1
  if %errorlevel%==0 (set RUNTIME=node) else (
    echo ERROR: ni bun ni node encontrado
    exit /b 1
  )
)
echo   Runtime: %RUNTIME%

REM 3. Arrancar server en background
echo [3/4] Arrancando server PRO en :%PORT%...
cd /d "%APPDIR%"
start "AzurTant-PRO-v9" /MIN cmd /c "%RUNTIME% server.mjs"

REM 4. Esperar y validar
echo [4/4] Validando arranque...
timeout /t 5 /nobreak >nul
curl -s -o nul -w "  Health: %%{http_code} (%%{time_total}s)\n" --max-time 5 http://localhost:%PORT%/api/health

echo.
echo === PRO v9 activo en http://localhost:%PORT% ===
echo Logs: %APPDIR%\logs\
pause