# Setup Instructions - AIForge Network

## ✅ Code Fixes Completed

1. ✅ Fixed CORS_ORIGINS format in .env (JSON array)
2. ✅ Fixed metadata column name conflict (renamed to payment_metadata and message_metadata)
3. ✅ Updated all code references
4. ✅ Updated migration files

## ⚠️ Database Connection Issue

There's a database encoding issue. The error suggests:
- Database connection string may have encoding problems
- PostgreSQL database may need to be recreated with UTF-8 encoding

## 🔧 Setup Steps

### Step 1: Check/Start PostgreSQL

**Windows:**
```powershell
# Check if PostgreSQL service is running
Get-Service -Name postgresql*

# Start PostgreSQL if not running
Start-Service postgresql-x64-XX  # Replace XX with your version
```

**Or use pgAdmin/SQL:**
- Open pgAdmin
- Connect to PostgreSQL server
- Create database `aiforge` with UTF-8 encoding
- Create user `aiforge` with password `aiforge`
- Grant all privileges on database `aiforge` to user `aiforge`

### Step 2: Fix Database Encoding (if needed)

If database exists but has encoding issues:

```sql
-- Connect to PostgreSQL
-- Drop and recreate database with UTF-8 encoding
DROP DATABASE IF EXISTS aiforge;
CREATE DATABASE aiforge 
    WITH OWNER = aiforge 
    ENCODING = 'UTF8' 
    LC_COLLATE = 'en_US.UTF-8' 
    LC_CTYPE = 'en_US.UTF-8';
```

### Step 3: Run Migrations

```powershell
cd backend
.\venv\Scripts\alembic.exe upgrade head
```

### Step 4: Start Backend

```powershell
cd backend
.\venv\Scripts\uvicorn.exe app.main:app --reload
```

Backend will start on: http://localhost:8000

### Step 5: Start Frontend

```powershell
cd frontend
npm run dev
```

Frontend will start on: http://localhost:5173

## 📋 Verification

1. **Backend API**: http://localhost:8000/docs
2. **Frontend**: http://localhost:5173
3. **Health Check**: http://localhost:8000/health

## 🎯 What's Ready

- ✅ All backend code complete
- ✅ All frontend code complete
- ✅ All migrations ready
- ✅ All API endpoints implemented
- ✅ All pages created

## 🚀 Next Steps After Setup

1. Register a user account
2. Connect TronLink wallet
3. Test Chat interface
4. Test NFT minting
5. Test Infrastructure investment
6. Browse Marketplace

## 📝 Notes

- Database must be UTF-8 encoded
- PostgreSQL must be running
- TronLink extension needed for wallet features
- NFT contract deployment needed for NFT features (optional for testing)

