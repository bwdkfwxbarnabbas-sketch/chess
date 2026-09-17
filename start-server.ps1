$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot
if (-not (Test-Path "backend\.venv\Scripts\python.exe")) {
  python -m venv backend\.venv
  backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\backend'; .\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot'; npm install; npm run dev -- --host 0.0.0.0"

Write-Host "Checkmate is starting."
Write-Host "Open http://localhost:5173"
