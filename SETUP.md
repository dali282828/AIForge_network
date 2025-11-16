# AIForge Network - Setup Guide

## Sprint 1 Implementation Status

All Sprint 1 tasks have been completed:

✅ **Backend**
- FastAPI project structure initialized
- PostgreSQL database schema (users, groups, memberships)
- JWT-based authentication endpoints
- Groups CRUD API
- Database migrations (Alembic)
- IPFS client integration
- MinIO storage service
- Redis configuration

✅ **Frontend**
- React + Vite + TypeScript project initialized
- Tailwind CSS configured
- Login/Register pages
- Dashboard layout
- Groups list and create group UI
- Zustand state management
- API client with axios

✅ **DevOps**
- Docker Compose setup (Postgres, Redis, MinIO, IPFS)
- CI/CD pipeline (GitHub Actions)
- Environment configuration

## Quick Start

### 1. Start Services

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- MinIO on ports 9000 (API) and 9001 (Console)
- IPFS on ports 4001, 5001, 8080
- Backend API on port 8000

### 2. Run Database Migrations

```bash
cd backend
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head
```

### 3. Start Backend (if not using Docker)

```bash
cd backend
uvicorn app.main:app --reload
```

### 4. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

## Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)
- **IPFS Gateway**: http://localhost:8080

## Environment Variables

Create `backend/.env`:

```env
DATABASE_URL=postgresql://aiforge:aiforge@localhost:5432/aiforge
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]
IPFS_HOST=localhost
IPFS_PORT=5001
IPFS_GATEWAY=http://localhost:8080
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_SECURE=false
```

## Testing the API

### Register a User

```bash
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "testpass123",
    "full_name": "Test User"
  }'
```

### Login

```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=testpass123"
```

### Create a Group (requires auth token)

```bash
curl -X POST "http://localhost:8000/api/groups" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Group",
    "description": "Test group",
    "is_public": false
  }'
```

## Next Steps (Sprint 2)

- Model upload endpoints with IPFS integration
- Model listing and management
- File upload UI
- IPFS pinning management

## Notes

- IPFS integration is ready but requires IPFS node to be running
- MinIO buckets are auto-created on first use
- Database migrations are in `backend/alembic/versions/`
- Frontend uses Zustand for state management with localStorage persistence

