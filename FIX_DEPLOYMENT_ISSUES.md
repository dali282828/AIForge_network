# 🔧 Fix Deployment Issues

## 🔍 Issues Found

### 1. Frontend Issue
- ❌ **Missing `VITE_API_URL`** - Frontend is trying to connect to `http://localhost:8000/api`
- ❌ Frontend doesn't know where the backend is

### 2. Backend Issue
- ❌ **Missing `DATABASE_URL`** - Backend can't connect to database
- ❌ **Password protected** - Can't test easily
- ❌ Missing other environment variables

## ✅ Fix Steps

### Step 1: Fix Frontend (2 minutes)

1. Go to: https://vercel.com/dalicursor-4767s-projects/aiforge-network/settings/environment-variables
2. Add environment variable:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://backend-f0iplfjpc-dalicursor-4767s-projects.vercel.app`
3. Click **Save**
4. **Redeploy frontend:**
   - Go to Deployments tab
   - Click "..." → "Redeploy"

### Step 2: Fix Backend (3 minutes)

1. Go to: https://vercel.com/dalicursor-4767s-projects/backend/settings/environment-variables
2. Add these variables:

**Required:**
```bash
DATABASE_URL=postgresql://neondb_owner:npg_VA0zCZBp2fmX@ep-wandering-cherry-ablwohlv-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require

CORS_ORIGINS=["https://aiforge-network-dd7lfpxl0-dalicursor-4767s-projects.vercel.app","http://localhost:5173"]

SECRET_KEY=your-very-long-random-secret-key-min-32-characters
```

**Optional (for now):**
```bash
REDIS_URL=redis://localhost:6379/0
IPFS_HOST=localhost
MINIO_ENDPOINT=localhost:9000
```

3. Click **Save**
4. **Redeploy backend:**
   ```bash
   cd backend
   vercel --prod
   ```

### Step 3: Disable Password Protection (Optional)

1. Go to: https://vercel.com/dalicursor-4767s-projects/backend/settings/deployment-protection
2. **Disable** password protection
3. Redeploy

## ✅ After Fixes

### Test Frontend:
- Visit: `https://aiforge-network-dd7lfpxl0-dalicursor-4767s-projects.vercel.app`
- Should load without errors
- Check browser console (F12) for API errors

### Test Backend:
- Visit: `https://backend-f0iplfjpc-dalicursor-4767s-projects.vercel.app/health`
- Should return: `{"status": "healthy", "database": "connected"}`

## 🐛 Common Errors

### Frontend: "Network Error" or "CORS Error"
- ✅ Check `VITE_API_URL` is set correctly
- ✅ Check `CORS_ORIGINS` includes frontend URL
- ✅ Redeploy both frontend and backend

### Backend: "Database disconnected"
- ✅ Check `DATABASE_URL` is correct
- ✅ Verify Neon database is running
- ✅ Check deployment logs

---

**Priority:** Fix frontend `VITE_API_URL` first, then backend `DATABASE_URL`!

