# PowerShell script to fix database encoding issue
# This script will help recreate the database with UTF-8 encoding

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "AIForge Network - Database Fix Script" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL is running
Write-Host "Checking PostgreSQL service..." -ForegroundColor Yellow
$pgService = Get-Service | Where-Object { $_.Name -like "*postgresql*" } | Select-Object -First 1

if ($pgService) {
    Write-Host "Found PostgreSQL service: $($pgService.Name)" -ForegroundColor Green
    if ($pgService.Status -ne "Running") {
        Write-Host "Starting PostgreSQL service..." -ForegroundColor Yellow
        Start-Service $pgService.Name
        Start-Sleep -Seconds 3
    }
    Write-Host "PostgreSQL is running" -ForegroundColor Green
} else {
    Write-Host "PostgreSQL service not found. Please ensure PostgreSQL is installed." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Attempting to fix database encoding..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Please run the following SQL commands in pgAdmin or psql:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Open pgAdmin or psql" -ForegroundColor Cyan
Write-Host "2. Connect to PostgreSQL server" -ForegroundColor Cyan
Write-Host "3. Run the SQL from: backend\fix_database_encoding.sql" -ForegroundColor Cyan
Write-Host ""
Write-Host "Or use psql command line:" -ForegroundColor Yellow
Write-Host "  psql -U postgres -f backend\fix_database_encoding.sql" -ForegroundColor White
Write-Host ""

# Try to find psql
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if ($psqlPath) {
    Write-Host "Found psql at: $($psqlPath.Source)" -ForegroundColor Green
    Write-Host ""
    $response = Read-Host "Do you want to run the SQL script now? (y/n)"
    if ($response -eq "y" -or $response -eq "Y") {
        Write-Host "Running SQL script..." -ForegroundColor Yellow
        $env:PGPASSWORD = "postgres"  # Change if your postgres user has different password
        & psql -U postgres -f "backend\fix_database_encoding.sql"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Database recreated successfully!" -ForegroundColor Green
        } else {
            Write-Host "Error running SQL script. Please run manually." -ForegroundColor Red
        }
    }
} else {
    Write-Host "psql not found in PATH. Please run SQL manually in pgAdmin." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "After fixing the database, run:" -ForegroundColor Cyan
Write-Host "  cd backend" -ForegroundColor White
Write-Host "  .\venv\Scripts\alembic.exe upgrade head" -ForegroundColor White
Write-Host ""

