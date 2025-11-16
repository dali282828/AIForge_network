# 🚀 Deploy Backend to Vercel (Quick Start)

This guide will help you deploy the backend to Vercel as serverless functions. This is a **quick start** option - you can migrate to Render later for better performance.

## ⚠️ Important Limitations

### Vercel Serverless Limitations:
- ⏱️ **10 second execution limit** (free tier)
- 🥶 **Cold starts** - first request can take 1-3 seconds
- 🔌 **No persistent connections** - Redis/DB reconnect on each request
- 📦 **50MB function size limit**
- ⚡ **Not ideal for long-running operations**

### When to Migrate to Render:
- ✅ When you need >10 second operations
- ✅ When you need persistent connections
- ✅ When you need always-on availability
- ✅ When you have many users

**But for getting started and testing, Vercel works great!**

## 📋 Prerequisites

- Vercel account (already logged in)
- GitHub repository with your code
- Free services set up (Supabase, Upstash, Cloudflare R2, Infura)

## 🚀 Step 1: Prepare Backend for Vercel

The backend is already configured with:
- ✅ `backend/vercel.json` - Vercel configuration
- ✅ `backend/api/index.py` - Serverless function entry point
- ✅ `mangum` - ASGI adapter for Vercel

## 🚀 Step 2: Deploy to Vercel

### Option A: Deploy via CLI (Recommended)

```bash
cd backend
vercel
```

Follow the prompts:
1. **Set up and deploy?** → Yes
2. **Which scope?** → Your account
3. **Link to existing project?** → No
4. **Project name?** → `aiforge-backend`
5. **Directory?** → `./backend`
6. **Override settings?** → No

### Option B: Deploy via Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset:** Other
   - **Root Directory:** `backend`
   - **Build Command:** (leave empty)
   - **Output Directory:** (leave empty)
5. Click **Deploy**

## ⚙️ Step 3: Configure Environment Variables

In Vercel dashboard → Your Project → **Settings** → **Environment Variables**, add:

```bash
# Database
DATABASE_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres

# Redis
REDIS_URL=redis://default:xxx@xxx.upstash.io:6379

# JWT
SECRET_KEY=your-very-long-random-secret-key-min-32-characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS (Your frontend URL)
CORS_ORIGINS=["https://your-frontend.vercel.app","http://localhost:5173"]

# IPFS (Infura)
IPFS_HOST=ipfs.infura.io
IPFS_PORT=5001
IPFS_GATEWAY=https://ipfs.infura.io/ipfs/
IPFS_PROJECT_ID=xxx
IPFS_PROJECT_SECRET=xxx

# Storage (Cloudflare R2)
MINIO_ENDPOINT=xxx.r2.cloudflarestorage.com
MINIO_ACCESS_KEY=xxx
MINIO_SECRET_KEY=xxx
MINIO_SECURE=true

# Platform Wallets
PLATFORM_WALLET_ETH=0xYourEthAddress
PLATFORM_WALLET_TRON=TYourTronAddress

# Admin Wallets
ADMIN_WALLETS=0xYourEthAddress,TYourTronAddress

# Blockchain RPC
ETH_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
TRON_RPC_URL=https://api.trongrid.io

# Fees (defaults)
PLATFORM_FEE_SUBSCRIPTION=0.30
PLATFORM_FEE_JOB=0.05
PLATFORM_FEE_MODEL=0.05
PLATFORM_FEE_API=0.10
MODEL_PUBLISHING_FEE=5.00
MODEL_LISTING_FEE=2.00
MODEL_LISTING_GRACE_PERIOD_DAYS=7

# Confirmations
ETH_REQUIRED_CONFIRMATIONS=3
TRON_REQUIRED_CONFIRMATIONS=19

# USDT Contracts
USDT_ETH_CONTRACT=0xdAC17F958D2ee523a2206206994597C13D831ec7
USDT_TRON_CONTRACT=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t

# NFT (optional)
NFT_CONTRACT_TRON=
NFT_MINT_GAS_FEE=0.10
NFT_REWARD_SUBSCRIPTION_PERCENT=0.30
NFT_REWARD_API_PERCENT=0.10
```

**Important:** After adding variables, **redeploy** your project!

## ✅ Step 4: Verify Deployment

1. Visit: `https://your-backend.vercel.app/health`
   - Should return: `{"status": "healthy"}`

2. Visit: `https://your-backend.vercel.app/`
   - Should return: `{"message": "AIForge Network API", "version": "0.1.0"}`

## 🔄 Step 5: Update Frontend

1. Go to Vercel dashboard → Frontend project
2. **Settings** → **Environment Variables**
3. Add/Update: `VITE_API_URL=https://your-backend.vercel.app`
4. Redeploy frontend

## 🐛 Troubleshooting

### Cold Start Issues
- First request takes 1-3 seconds (normal for serverless)
- Subsequent requests are fast
- Consider using Vercel Pro for better cold start performance

### Timeout Errors
- Vercel free tier: 10 second limit
- If operations take longer, you'll need to:
  - Optimize your code
  - Use background jobs
  - Migrate to Render

### Database Connection Errors
- Serverless functions create new connections each time
- Make sure connection pooling is enabled in Supabase
- Consider using connection pooling service

### Function Size Limit
- Vercel has 50MB function size limit
- If you exceed this, remove unused dependencies
- Or migrate to Render (no size limit)

## 🔄 Migrating to Render Later

When you're ready to migrate to Render:

1. **Keep Vercel running** (no downtime)
2. **Deploy to Render** using `DEPLOYMENT_GUIDE.md`
3. **Update frontend** `VITE_API_URL` to Render URL
4. **Test everything** on Render
5. **Delete Vercel deployment** when ready

**Migration is easy** - same code, same environment variables, just different hosting!

## 📊 Vercel vs Render Comparison

| Feature | Vercel (Free) | Render (Free) |
|---------|---------------|---------------|
| **Execution Time** | 10 seconds | Unlimited |
| **Cold Starts** | 1-3 seconds | None (always-on) |
| **Persistent Connections** | ❌ No | ✅ Yes |
| **Always-On** | ❌ No | ✅ Yes (sleeps after 15min) |
| **Function Size** | 50MB | Unlimited |
| **Best For** | Quick start, testing | Production, always-on |

## ✅ You're Done!

Your backend is now live on Vercel:
- **Backend:** `https://your-backend.vercel.app`
- **Frontend:** `https://your-frontend.vercel.app`

## 🎯 Next Steps

1. ✅ Test all features
2. ✅ Monitor performance
3. ✅ Watch for timeout errors
4. ✅ Plan migration to Render when needed

---

**Ready to migrate to Render?** See `DEPLOYMENT_GUIDE.md` when you're ready for better performance!

