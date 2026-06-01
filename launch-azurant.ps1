# Kill all browsers and node
Get-Process -Name msedge,chrome,node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 3

# Start vite server
Set-Location C:\Users\Manu\azurant-app
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npx vite preview --port 5182 --host" -WindowStyle Normal

# Start Edge clean
Start-Sleep -Seconds 3
$edge = Get-Item "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$proc = Start-Process $edge.FullName -ArgumentList "--new-window","--user-data-dir=C:\tmp\azurant-clean","--disable-extensions","http://localhost:5182/fixed.html" -PassThru
Write-Host "Started Edge with PID $($proc.Id)"