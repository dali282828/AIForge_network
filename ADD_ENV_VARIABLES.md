# 🔧 Add Environment Variables - Step by Step

## ❌ Issue Found

**Frontend:** Missing `VITE_API_URL` environment variable!

## ✅ Fix Frontend (2 minutes)

### Option 1: Via Vercel Dashboard (Easiest)

1. Go to: https://vercel.com/dalicursor-4767s-projects/aiforge-network/settings/environment-variables
2. Click **"Add New"**
3. Fill in:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://backend-mba4hawll-dalicursor-4767s-projects.vercel.app`
   - **Environment:** Select **Production** (and Preview if you want)
4. Click **Save**
5. **Redeploy frontend:**
   - Go to **Deployments** tab
   - Click **"..."** on latest deployment
   - Click **"Redeploy"**

### Option 2: Via CLI

```bash
cd C:\Users\asus\AIForge_network
vercel env add VITE_API_URL production
# When prompted, enter: https://backend-mba4hawll-dalicursor-4767s-projects.vercel.app
```

Then redeploy:
```bash
vercel --prod
```

---

## 🔍 Check Backend Issues

The backend shows "Downloading 0 deployment files" which might mean files aren't being uploaded. Let me check the backend structure.

---

## 📋 Current Status

✅ **Backend Environment Variables:**
- DATABASE_URL ✅
- CORS_ORIGINS ✅
- SECRET_KEY ✅

❌ **Frontend Environment Variables:**
- VITE_API_URL ❌ **MISSING!**

---

**Action Required:** Add `VITE_API_URL` to frontend and redeploy!

