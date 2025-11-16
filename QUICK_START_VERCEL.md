# ⚡ Quick Start: Deploy Backend to Vercel (5 Minutes)

Fastest way to get your backend live - deploy to Vercel now, migrate to Render later!

## 🎯 Why Vercel First?

- ✅ **Super fast setup** (5 minutes)
- ✅ **No credit card needed**
- ✅ **Same codebase** - easy to migrate later
- ✅ **Perfect for testing** and getting started

## ⚠️ Limitations

- ⏱️ 10 second execution limit
- 🥶 Cold starts (1-3 seconds first request)
- 🔌 No persistent connections

**But it works great for getting started!**

## 🚀 Deploy in 3 Steps

### Step 1: Deploy Backend (2 min)

```bash
cd backend
vercel
```

Follow prompts:
- Link to existing project? → **No**
- Project name? → **aiforge-backend**
- Directory? → **./backend**

### Step 2: Add Environment Variables (2 min)

1. Go to Vercel dashboard → Your project → **Settings** → **Environment Variables**
2. Add all variables from `SETUP_FREE_SERVICES.md`
3. Click **Redeploy**

### Step 3: Update Frontend (1 min)

1. Vercel dashboard → Frontend project → **Settings** → **Environment Variables**
2. Add: `VITE_API_URL=https://your-backend.vercel.app`
3. Redeploy

## ✅ Done!

Your backend is live:
- **Backend:** `https://your-backend.vercel.app`
- **Frontend:** `https://your-frontend.vercel.app`

## 🔄 Migrate to Render Later

When ready for better performance:
1. Follow `DEPLOYMENT_GUIDE.md`
2. Update frontend URL
3. Delete Vercel deployment

**Same code, same variables, just better hosting!**

---

**Full guide:** See `VERCEL_BACKEND_DEPLOYMENT.md` for detailed instructions.

