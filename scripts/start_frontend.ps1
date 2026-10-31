# Starts the CampusOS AI Next.js Frontend Server
Write-Host "Starting CampusOS AI Frontend on http://localhost:3000..." -ForegroundColor Cyan

Set-Location "$PSScriptRoot\..\frontend"
npm run dev
