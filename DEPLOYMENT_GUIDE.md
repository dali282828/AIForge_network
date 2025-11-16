# 🚀 Free Deployment Guide (No Credit Card Required)

This guide will help you deploy AIForge Network to production using **100% free services** without requiring a credit card.

## 📋 Prerequisites

- GitHub account (free)
- Email address
- 30 minutes of your time

## 🎯 Deployment Architecture

```
Frontend (Vercel) → Backend (Render) → Database (Supabase/Neon)
                                    → Redis (Upstash)
                                    → Storage (Cloudflare R2)
                                    → IPFS (Infura/Pinata)
```

## 📦 Step 1: Set Up Free Services

### 1.1 Database: Supabase (PostgreSQL)

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up with GitHub (no credit card)
3. Create a new project
4. Go to **Settings** → **Database**
5. Copy the **Connection String** (URI format)
   - Format: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
6. Save this for later: `DATABASE_URL`

**Free Tier Limits:**
- 500 MB database
- 2 GB bandwidth/month
- Unlimited API requests

### 1.2 Redis: Upstash

1. Go to [https://upstash.com](https://upstash.com)
2. Sign up with GitHub (no credit card)
3. Click **Create Database**
4. Choose **Regional** (free tier)
5. Select a region close to your Render region
6. Copy the **Redis URL**
   - Format: `redis://default:[PASSWORD]@[HOST]:6379`
7. Save this for later: `REDIS_URL`

**Free Tier Limits:**
- 10,000 commands/day
- 256 MB storage

### 1.3 Storage: Cloudflare R2

1. Go to [https://dash.cloudflare.com](https://dash.cloudflare.com)
2. Sign up (no credit card)
3. Go to **R2** → **Create bucket**
4. Name your bucket (e.g., `aiforge-storage`)
5. Go to **Manage R2 API Tokens** → **Create API Token**
6. Give it **Admin Read & Write** permissions
7. Copy:
   - **Account ID**
   - **Access Key ID**
   - **Secret Access Key**
8. Save these for later:
   - `MINIO_ENDPOINT` = `[ACCOUNT-ID].r2.cloudflarestorage.com`
   - `MINIO_ACCESS_KEY` = Access Key ID
   - `MINIO_SECRET_KEY` = Secret Access Key

**Free Tier Limits:**
- 10 GB storage
- 1 million Class A operations/month
- 10 million Class B operations/month

### 1.4 IPFS: Infura

1. Go to [https://infura.io](https://infura.io)
2. Sign up (no credit card)
3. Create a new project
4. Go to **IPFS** tab
5. Copy:
   - **Project ID**
   - **Project Secret**
6. Save these for later:
   - `IPFS_HOST` = `ipfs.infura.io`
   - `IPFS_PORT` = `5001`
   - `IPFS_GATEWAY` = `https://ipfs.infura.io/ipfs/`
   - You'll need to use Infura's IPFS API with authentication

**Free Tier Limits:**
- 5 GB storage
- Unlimited requests

**Alternative: Pinata**
- Go to [https://pinata.cloud](https://pinata.cloud)
- Sign up (no credit card)
- Free tier: 1 GB storage, unlimited requests

## 🖥️ Step 2: Deploy Backend to Render

### 2.1 Prepare Your Repository

1. Push your code to GitHub (if not already)
2. Make sure `render.yaml` is in the root directory
3. Make sure `backend/Dockerfile` exists

### 2.2 Deploy on Render

1. Go to [https://render.com](https://render.com)
2. Sign up with GitHub (no credit card)
3. Click **New +** → **Blueprint**
4. Connect your GitHub repository
5. Render will detect `render.yaml` automatically
6. Click **Apply**

### 2.3 Configure Environment Variables

In Render dashboard, go to your service → **Environment** tab and add:

```bash
# Database
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres

# Redis
REDIS_URL=redis://default:password@xxx.upstash.io:6379

# JWT
SECRET_KEY=your-very-long-random-secret-key-min-32-characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS (replace with your Vercel frontend URL)
CORS_ORIGINS=["https://your-frontend.vercel.app","http://localhost:5173"]

# IPFS (Infura)
IPFS_HOST=ipfs.infura.io
IPFS_PORT=5001
IPFS_GATEWAY=https://ipfs.infura.io/ipfs/

# Storage (Cloudflare R2)
MINIO_ENDPOINT=your-account-id.r2.cloudflarestorage.com
MINIO_ACCESS_KEY=your-access-key-id
MINIO_SECRET_KEY=your-secret-access-key
MINIO_SECURE=true

# Platform Wallets (Your wallets for receiving fees)
PLATFORM_WALLET_ETH=0xYourEthAddress
PLATFORM_WALLET_TRON=TYourTronAddress

# Admin Wallets (comma-separated)
ADMIN_WALLETS=0xYourEthAddress,TYourTronAddress

# Blockchain RPC
ETH_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
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

### 2.4 Wait for Deployment

- First deployment takes 5-10 minutes
- Render will build your Docker image
- Check logs for any errors
- Once deployed, you'll get a URL like: `https://aiforge-backend.onrender.com`

### 2.5 Important: Render Free Tier Limitations

⚠️ **Free tier sleeps after 15 minutes of inactivity**
- First request after sleep takes ~30 seconds (cold start)
- To prevent sleeping, you can use a service like [UptimeRobot](https://uptimerobot.com) (free) to ping your health endpoint every 5 minutes

## 🌐 Step 3: Update Frontend Environment

### 3.1 Update Vercel Environment Variables

1. Go to your Vercel project: [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add:
   ```
   VITE_API_URL=https://your-backend.onrender.com
   ```
5. Redeploy your frontend

### 3.2 Update CORS in Backend

Make sure your backend `CORS_ORIGINS` includes your Vercel frontend URL:
```bash
CORS_ORIGINS=["https://your-frontend.vercel.app","http://localhost:5173"]
```

## ✅ Step 4: Verify Deployment

### 4.1 Test Backend

1. Visit: `https://your-backend.onrender.com/health`
   - Should return: `{"status": "healthy"}`

2. Visit: `https://your-backend.onrender.com/`
   - Should return: `{"message": "AIForge Network API", "version": "0.1.0"}`

### 4.2 Test Frontend

1. Visit your Vercel URL
2. Try to register/login
3. Check browser console for any errors

## 🔧 Step 5: Keep Backend Awake (Optional)

Since Render free tier sleeps, set up a free uptime monitor:

1. Go to [https://uptimerobot.com](https://uptimerobot.com)
2. Sign up (free)
3. Add a new monitor:
   - Type: **HTTP(s)**
   - URL: `https://your-backend.onrender.com/health`
   - Interval: **5 minutes**
4. This will ping your backend every 5 minutes to keep it awake

## 📊 Service Limits Summary

| Service | Free Tier Limit |
|---------|----------------|
| **Render** | 750 hours/month, sleeps after 15min inactivity |
| **Supabase** | 500 MB database, 2 GB bandwidth/month |
| **Upstash** | 10,000 commands/day, 256 MB storage |
| **Cloudflare R2** | 10 GB storage, 1M reads/month |
| **Infura IPFS** | 5 GB storage, unlimited requests |
| **Vercel** | Unlimited requests, 100 GB bandwidth |

## 🐛 Troubleshooting

### Backend won't start
- Check Render logs for errors
- Verify all environment variables are set
- Check database connection string format

### Database connection errors
- Verify Supabase connection string
- Check if database is accessible from Render's IP
- Supabase allows connections from anywhere by default

### Redis connection errors
- Verify Upstash Redis URL format
- Check if Redis is in the same region as Render
- Verify Redis credentials

### Storage errors
- Verify Cloudflare R2 credentials
- Check bucket name and permissions
- Verify endpoint format

### CORS errors
- Make sure frontend URL is in `CORS_ORIGINS`
- Check if backend URL is correct in frontend
- Verify CORS_ORIGINS is valid JSON array

## 🎉 You're Done!

Your platform is now live and accessible to users!

**Frontend:** `https://your-frontend.vercel.app`  
**Backend:** `https://your-backend.onrender.com`

## 📝 Next Steps

1. Set up admin wallets in environment variables
2. Configure platform wallets for receiving fees
3. Test all features (upload models, create groups, etc.)
4. Set up monitoring (UptimeRobot for keeping backend awake)
5. Consider upgrading to paid tiers as you grow

## 💡 Tips

- **Monitor your usage** to stay within free tier limits
- **Set up alerts** for when you approach limits
- **Use UptimeRobot** to keep Render backend awake
- **Backup your database** regularly (Supabase has automatic backups)
- **Monitor logs** in Render dashboard for errors

---

**Need Help?** Check the logs in Render dashboard or open an issue on GitHub.

