# Start Node Client
Write-Host "Starting AIForge Node Client..." -ForegroundColor Green

cd node-client

# Activate virtual environment
if (Test-Path "venv\Scripts\Activate.ps1") {
    & .\venv\Scripts\Activate.ps1
} else {
    Write-Host "Virtual environment not found. Creating..." -ForegroundColor Yellow
    python -m venv venv
    & .\venv\Scripts\Activate.ps1
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    pip install -r requirements.txt
}

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file from defaults..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env" -ErrorAction SilentlyContinue
}

Write-Host "Starting node client..." -ForegroundColor Cyan
Write-Host "Make sure Docker is running and backend is started!" -ForegroundColor Yellow
Write-Host ""

python src/main.py

