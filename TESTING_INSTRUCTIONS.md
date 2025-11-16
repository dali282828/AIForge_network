# Testing Instructions for AIForge Network

## Important Notes

The project is built and ready, but there are some setup considerations:

### Python Version
- **Recommended**: Python 3.11 (better package compatibility)
- Current system has Python 3.13, which may have dependency resolution issues
- Consider using Python 3.11 for smoother installation

### Docker Desktop Required
Docker Desktop must be running before starting services.

## Quick Test Steps

### 1. Start Docker Desktop
- Open Docker Desktop application
- Wait until it's fully started (whale icon in system tray)

### 2. Start Services
```powershell
docker-compose up -d
```

### 3. Setup Backend (Python 3.11 recommended)
```powershell
# If you have Python 3.11, use it:
py -3.11 -m venv backend\venv
backend\venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt

# Or with Python 3.13 (may have issues):
cd backend
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 4. Run Database Migrations
```powershell
cd backend
venv\Scripts\Activate.ps1
alembic upgrade head
```

### 5. Start Backend Server
```powershell
cd backend
venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

Backend will run on: http://localhost:8000
API Docs: http://localhost:8000/docs

### 6. Setup Frontend (in a new terminal)
```powershell
cd frontend
npm install
npm run dev
```

Frontend will run on: http://localhost:5173

## Testing the Application

1. **Register a User**
   - Go to http://localhost:5173
   - Click "Sign up"
   - Create an account

2. **Create a Group**
   - After login, go to "Groups"
   - Click "Create Group"
   - Fill in name and description

3. **Upload a Model**
   - Go to your group
   - Click "Upload Model"
   - Select a model file (e.g., .safetensors, .pth, .onnx)
   - Fill in model information
   - Upload

4. **View Model Details**
   - Click on a model to see details
   - Check IPFS CID if IPFS is running
   - Download the model

## Troubleshooting

### Docker not starting
- Make sure Docker Desktop is installed and running
- Check Windows WSL 2 is enabled (if using WSL backend)

### Python dependency issues
- Use Python 3.11 instead of 3.13
- Or install packages individually if needed

### Database connection errors
- Verify PostgreSQL container is running: `docker ps`
- Check logs: `docker-compose logs postgres`

### IPFS not working
- IPFS is optional for basic testing
- Models will still upload to MinIO
- Check IPFS container: `docker ps | findstr ipfs`

## What's Working

✅ User authentication (register/login)
✅ Group management
✅ Model upload to MinIO
✅ Model listing and details
✅ IPFS integration (when IPFS node is running)
✅ HuggingFace import (when huggingface-hub is installed)

## Next Steps

Once basic testing is complete, we can proceed with:
- Sprint 3: Node Client Prototype
- Sprint 4: Fine-tuning jobs
- Sprint 5: Permissions & Privacy
- Sprint 6: Credits & Rewards

