# 🚀 Quick Start Deployment (5 Minutes)

Fastest way to get your platform live!

## Prerequisites
- GitHub account
- 5 minutes

## Step 1: Push to GitHub (2 min)

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

## Step 2: Set Up Services (15 min)

Follow **SETUP_FREE_SERVICES.md** to get:
- ✅ Supabase database URL
- ✅ Upstash Redis URL  
- ✅ Cloudflare R2 credentials
- ✅ Infura IPFS credentials

## Step 3: Deploy Backend to Render (3 min)

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click **New +** → **Blueprint**
4. Connect your GitHub repo
5. Render auto-detects `render.yaml`
6. Click **Apply**
7. Add environment variables (from Step 2)
8. Wait for deployment (~5 min)

## Step 4: Update Frontend (1 min)

1. Go to [vercel.com](https://vercel.com)
2. Your project → **Settings** → **Environment Variables**
3. Add: `VITE_API_URL=https://your-backend.onrender.com`
4. Redeploy

## Step 5: Keep Backend Awake (Optional)

1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Add monitor:
   - URL: `https://your-backend.onrender.com/health`
   - Interval: 5 minutes
3. This prevents Render from sleeping

## ✅ Done!

Your platform is live:
- **Frontend:** `https://your-frontend.vercel.app`
- **Backend:** `https://your-backend.onrender.com`

## 📚 Full Documentation

- **SETUP_FREE_SERVICES.md** - Detailed service setup
- **DEPLOYMENT_GUIDE.md** - Complete deployment guide
- **render.yaml** - Render configuration

---

**Total Time:** ~20 minutes  
**Cost:** $0 (100% free)
