# Starts the CampusOS AI FastAPI Backend Server
Write-Host "Starting CampusOS AI Backend on http://localhost:8000..." -ForegroundColor Cyan

$env:PYTHONPATH = "$PSScriptRoot\.."
& "$PSScriptRoot\..\backend\.venv\Scripts\uvicorn.exe" backend.app.main:app --host 0.0.0.0 --port 8000 --reload
