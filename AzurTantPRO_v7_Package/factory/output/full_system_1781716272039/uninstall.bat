@echo off
echo 🗑️ Desinstalando Test Co...
powershell -Command "Stop-Service 'Test_Co' -ErrorAction SilentlyContinue; Remove-Service 'Test_Co' -ErrorAction SilentlyContinue"
echo ✅ Servicio removido
echo ✅ Desinstalación completa
pause
