# ⚡ Quick Test Guide

Test your database connection in 3 steps!

## 🚀 Step 1: Add DATABASE_URL (1 minute)

1. Open: https://vercel.com/dalicursor-4767s-projects/backend/settings/environment-variables
2. Click **"Add New"**
3. Paste this:

**Key:** `DATABASE_URL`  
**Value:** `postgresql://neondb_owner:npg_VA0zCZBp2fmX@ep-wandering-cherry-ablwohlv-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require`

4. Click **Save**

## 🚀 Step 2: Redeploy (1 minute)

**Option A: Via CLI**
```bash
cd backend
vercel --prod
```

**Option B: Via Dashboard**
1. Go to: https://vercel.com/dalicursor-4767s-projects/backend
2. Click **"Deployments"** tab
3. Click **"..."** → **"Redeploy"**

## 🚀 Step 3: Test (30 seconds)

Visit: `https://backend-ln1rviy2l-dalicursor-4767s-projects.vercel.app/health`

**✅ Success:**
```json
{
  "status": "healthy",
  "database": "connected"
}
```

**❌ Error:**
```json
{
  "status": "degraded",
  "database": "disconnected",
  "error": "..."
}
```

## ✅ If Success

Database is working! We can proceed to:
1. Set up Redis
2. Set up IPFS
3. Set up Storage

## ❌ If Error

Check:
1. Is `DATABASE_URL` correct in Vercel?
2. Check deployment logs for errors
3. Verify Neon database is running

---

**Ready?** Let's test! 🚀

