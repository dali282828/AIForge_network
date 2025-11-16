# ⚡ Quick Fix - Frontend & Backend Connection

## 🚨 Main Issues

1. **Frontend** → Missing `VITE_API_URL` (trying to connect to localhost)
2. **Backend** → Missing `DATABASE_URL` (can't connect to database)
3. **CORS** → Backend doesn't know frontend URL

## ✅ Quick Fix (5 minutes)

### 1. Fix Frontend (1 min)

**Add to Vercel:**
- Project: `aiforge-network`
- Settings → Environment Variables
- **Key:** `VITE_API_URL`
- **Value:** `https://backend-f0iplfjpc-dalicursor-4767s-projects.vercel.app`
- **Redeploy**

### 2. Fix Backend (2 min)

**Add to Vercel:**
- Project: `backend`
- Settings → Environment Variables

**Add these:**
```bash
DATABASE_URL=postgresql://neondb_owner:npg_VA0zCZBp2fmX@ep-wandering-cherry-ablwohlv-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require

CORS_ORIGINS=["https://aiforge-network-dd7lfpxl0-dalicursor-4767s-projects.vercel.app","http://localhost:5173"]

SECRET_KEY=change-this-to-random-32-character-string
```

**Redeploy:**
```bash
cd backend
vercel --prod
```

### 3. Test (1 min)

**Frontend:**
- Visit: `https://aiforge-network-dd7lfpxl0-dalicursor-4767s-projects.vercel.app`
- Should load!

**Backend:**
- Visit: `https://backend-f0iplfjpc-dalicursor-4767s-projects.vercel.app/health`
- Should return: `{"status": "healthy", "database": "connected"}`

---

**That's it!** After these fixes, frontend and backend should work together! 🎉

