# Quick Start Guide - Testing AIForge Network

## Prerequisites

1. **Docker Desktop** - Must be running!
   - Download from: https://www.docker.com/products/docker-desktop
   - Start Docker Desktop before proceeding

2. **Python 3.11+** (recommended) or Python 3.13
3. **Node.js 18+**

## Step-by-Step Testing

### Step 1: Start Docker Desktop
- Open Docker Desktop application
- Wait until it shows "Docker Desktop is running"

### Step 2: Start Docker Services
Open a PowerShell terminal in the project root and run:

```powershell
docker-compose up -d
```

This starts:
- PostgreSQL (database) on port 5432
- Redis (job queue) on port 6379
- MinIO (file storage) on ports 9000, 9001
- IPFS (decentralized storage) on ports 4001, 5001, 8080

Wait about 10-15 seconds for services to be ready.

### Step 3: Run Database Migrations
In a new PowerShell terminal:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
alembic upgrade head
```

### Step 4: Start Backend Server
Keep the same terminal or use the script:

```powershell
# Option 1: Use the script
.\start_backend.ps1

# Option 2: Manual
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

Backend will run on: **http://localhost:8000**
API Docs: **http://localhost:8000/docs**

### Step 5: Start Frontend (New Terminal)
Open a new PowerShell terminal:

```powershell
# Option 1: Use the script
.\start_frontend.ps1

# Option 2: Manual
cd frontend
npm install
npm run dev
```

Frontend will run on: **http://localhost:5173**

### Step 6: (Optional) Start Node Client
Open another PowerShell terminal:

```powershell
# Option 1: Use the script
.\start_node.ps1

# Option 2: Manual
cd node-client
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python src/main.py
```

## Testing the Application

1. **Open Browser**: Go to http://localhost:5173

2. **Register Account**:
   - Click "Sign up"
   - Enter email, username, password
   - Click "Sign up"

3. **Create a Group**:
   - Click "Groups" in navigation
   - Click "Create Group"
   - Enter name and description
   - Click "Create"

4. **Upload a Model**:
   - Go to your group
   - Click "Upload Model"
   - Select a file (any file for testing)
   - Fill in model information
   - Click "Upload Model"

5. **View Model**:
   - Click on the uploaded model
   - See model details including IPFS CID (if IPFS is running)

6. **Create a Test Job** (via API):
   - Go to http://localhost:8000/docs
   - Use the `/api/jobs` POST endpoint
   - Create a test job
   - Node client should pick it up if running

## Troubleshooting

### Docker not starting
- Make sure Docker Desktop is installed and running
- Check Windows WSL 2 is enabled (if using WSL backend)
- Restart Docker Desktop

### Database connection errors
- Verify PostgreSQL container is running: `docker ps`
- Check logs: `docker-compose logs postgres`
- Wait a bit longer for services to start

### Python dependency issues
- Use Python 3.11 if possible (better compatibility)
- Try installing packages one by one if needed
- Check virtual environment is activated

### Port already in use
- Change ports in docker-compose.yml if needed
- Or stop the service using the port

### IPFS not working
- IPFS is optional for basic testing
- Models will still upload to MinIO
- Check IPFS container: `docker ps | findstr ipfs`

## Quick Commands

```powershell
# Check Docker services
docker ps

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Restart services
docker-compose restart
```

## What's Working

✅ User authentication (register/login)
✅ Group management
✅ Model upload to MinIO
✅ Model listing and details
✅ IPFS integration (when IPFS node is running)
✅ Node client registration
✅ Job creation and polling
✅ Docker job execution

## Next Steps After Testing

Once everything is working, you can:
- Test model uploads with real AI model files
- Create fine-tuning jobs
- Test multiple nodes
- Explore IPFS features

