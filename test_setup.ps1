# AIForge Network Test Setup Script
Write-Host "AIForge Network - Test Setup" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Check Docker
Write-Host "`nChecking Docker..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    Write-Host "  Then run: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

# Check Python
Write-Host "`nChecking Python..." -ForegroundColor Yellow
$pythonVersion = python --version
Write-Host "✓ $pythonVersion" -ForegroundColor Green

# Check Node.js
Write-Host "`nChecking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Start Docker services
Write-Host "`nStarting Docker services..." -ForegroundColor Yellow
docker-compose up -d

# Wait for services to be ready
Write-Host "Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Setup backend
Write-Host "`nSetting up backend..." -ForegroundColor Yellow
Set-Location backend

if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

Write-Host "Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

Write-Host "Running database migrations..." -ForegroundColor Yellow
alembic upgrade head

Set-Location ..

# Setup frontend
Write-Host "`nSetting up frontend..." -ForegroundColor Yellow
Set-Location frontend

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
    npm install
}

Set-Location ..

Write-Host "`n✓ Setup complete!" -ForegroundColor Green
Write-Host "`nTo start the application:" -ForegroundColor Yellow
Write-Host "  1. Backend: cd backend && venv\Scripts\activate && uvicorn app.main:app --reload" -ForegroundColor Cyan
Write-Host "  2. Frontend: cd frontend && npm run dev" -ForegroundColor Cyan
Write-Host "`nThen open http://localhost:5173 in your browser" -ForegroundColor Green

