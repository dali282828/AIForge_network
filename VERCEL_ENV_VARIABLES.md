# 🔐 Vercel Environment Variables Setup

Complete list of environment variables needed for your backend deployment.

## 📋 Required Variables

Add these to your Vercel backend project:
**Dashboard:** https://vercel.com/dalicursor-4767s-projects/backend/settings/environment-variables

### 1. Database (Neon PostgreSQL) ✅
```bash
DATABASE_URL=postgresql://neondb_owner:npg_VA0zCZBp2fmX@ep-wandering-cherry-ablwohlv-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
```

### 2. Redis (Upstash - Still Needed)
```bash
REDIS_URL=redis://default:password@host:6379
```
**Get from:** [https://upstash.com](https://upstash.com)

### 3. JWT Security
```bash
SECRET_KEY=your-very-long-random-secret-key-min-32-characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**Generate SECRET_KEY:**
```bash
# Linux/Mac
openssl rand -hex 32

# Windows PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

### 4. CORS Origins
```bash
CORS_ORIGINS=["https://aiforge-network-dd7lfpxl0-dalicursor-4767s-projects.vercel.app","http://localhost:5173"]
```

### 5. IPFS (Infura - Still Needed)
```bash
IPFS_HOST=ipfs.infura.io
IPFS_PORT=5001
IPFS_GATEWAY=https://ipfs.infura.io/ipfs/
IPFS_PROJECT_ID=your_project_id
IPFS_PROJECT_SECRET=your_project_secret
```
**Get from:** [https://infura.io](https://infura.io)

### 6. Storage (Cloudflare R2 - Still Needed)
```bash
MINIO_ENDPOINT=your-account-id.r2.cloudflarestorage.com
MINIO_ACCESS_KEY=your-access-key-id
MINIO_SECRET_KEY=your-secret-access-key
MINIO_SECURE=true
```
**Get from:** [https://dash.cloudflare.com](https://dash.cloudflare.com) → R2

### 7. Platform Wallets
```bash
PLATFORM_WALLET_ETH=0xYourEthAddress
PLATFORM_WALLET_TRON=TYourTronAddress
```

### 8. Admin Wallets
```bash
ADMIN_WALLETS=0xYourEthAddress,TYourTronAddress
```

### 9. Blockchain RPC
```bash
ETH_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
TRON_RPC_URL=https://api.trongrid.io
```

### 10. Fees (Defaults)
```bash
PLATFORM_FEE_SUBSCRIPTION=0.30
PLATFORM_FEE_JOB=0.05
PLATFORM_FEE_MODEL=0.05
PLATFORM_FEE_API=0.10
MODEL_PUBLISHING_FEE=5.00
MODEL_LISTING_FEE=2.00
MODEL_LISTING_GRACE_PERIOD_DAYS=7
```

### 11. Confirmations
```bash
ETH_REQUIRED_CONFIRMATIONS=3
TRON_REQUIRED_CONFIRMATIONS=19
```

### 12. USDT Contracts
```bash
USDT_ETH_CONTRACT=0xdAC17F958D2ee523a2206206994597C13D831ec7
USDT_TRON_CONTRACT=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
```

### 13. NFT (Optional)
```bash
NFT_CONTRACT_TRON=
NFT_MINT_GAS_FEE=0.10
NFT_REWARD_SUBSCRIPTION_PERCENT=0.30
NFT_REWARD_API_PERCENT=0.10
```

## ✅ Quick Setup Checklist

- [x] ✅ Database (Neon) - **You have this!**
- [ ] ⏳ Redis (Upstash) - Still needed
- [ ] ⏳ IPFS (Infura) - Still needed
- [ ] ⏳ Storage (Cloudflare R2) - Still needed
- [ ] ⏳ SECRET_KEY - Generate and add
- [ ] ⏳ CORS_ORIGINS - Add your frontend URL
- [ ] ⏳ Platform/Admin wallets - Add your addresses

## 🚀 After Adding Variables

1. **Redeploy backend:**
   ```bash
   cd backend
   vercel --prod
   ```

2. **Check deployment logs** for any errors

3. **Test health endpoint:**
   ```
   https://your-backend.vercel.app/health
   ```

---

**Priority:** Add `DATABASE_URL` first, then add other services as you set them up!

