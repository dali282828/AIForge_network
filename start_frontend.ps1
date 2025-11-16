# Start Frontend Server
Write-Host "Starting AIForge Frontend..." -ForegroundColor Green

cd frontend

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "Starting frontend dev server on http://localhost:5173" -ForegroundColor Cyan
Write-Host ""

npm run dev

