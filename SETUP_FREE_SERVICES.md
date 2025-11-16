# 🆓 Quick Setup Guide for Free Services

This guide will help you quickly set up all the free services needed for deployment.

## ⚡ Quick Links

### 1. Database: Supabase
- **URL:** [https://supabase.com](https://supabase.com)
- **Sign up:** GitHub OAuth (no credit card)
- **Steps:**
  1. Click "Start your project"
  2. Sign in with GitHub
  3. Click "New Project"
  4. Fill in:
     - Name: `aiforge-network`
     - Database Password: (generate strong password, save it!)
     - Region: Choose closest to you
  5. Wait 2 minutes for setup
  6. Go to **Settings** → **Database**
  7. Copy **Connection String** (URI format)
  8. Save as `DATABASE_URL`

**Connection String Format:**
```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

---

### 2. Redis: Upstash
- **URL:** [https://upstash.com](https://upstash.com)
- **Sign up:** GitHub OAuth (no credit card)
- **Steps:**
  1. Click "Sign Up" → "Continue with GitHub"
  2. Click "Create Database"
  3. Fill in:
     - Name: `aiforge-redis`
     - Type: **Regional** (free tier)
     - Region: Choose same as Render (e.g., `us-west-1`)
  4. Click "Create"
  5. Copy **Redis URL**
  6. Save as `REDIS_URL`

**Redis URL Format:**
```
redis://default:[PASSWORD]@[HOST]:6379
```

---

### 3. Storage: Cloudflare R2
- **URL:** [https://dash.cloudflare.com](https://dash.cloudflare.com)
- **Sign up:** Email (no credit card)
- **Steps:**
  1. Sign up / Sign in
  2. Go to **R2** in sidebar
  3. Click "Create bucket"
  4. Name: `aiforge-storage`
  5. Location: Choose closest to you
  6. Click "Create bucket"
  7. Go to **Manage R2 API Tokens**
  8. Click "Create API Token"
  9. Fill in:
     - Token name: `aiforge-api-token`
     - Permissions: **Admin Read & Write**
     - TTL: Leave empty (no expiration)
  10. Click "Create API Token"
  11. **IMPORTANT:** Copy these immediately (shown only once):
     - **Account ID** (top right of dashboard)
     - **Access Key ID**
     - **Secret Access Key**
  12. Save as:
     - `MINIO_ENDPOINT` = `[ACCOUNT-ID].r2.cloudflarestorage.com`
     - `MINIO_ACCESS_KEY` = Access Key ID
     - `MINIO_SECRET_KEY` = Secret Access Key

**Example:**
```
MINIO_ENDPOINT=abc123def456.r2.cloudflarestorage.com
MINIO_ACCESS_KEY=abc123def4567890
MINIO_SECRET_KEY=xyz789secretkey123456
```

---

### 4. IPFS: Infura
- **URL:** [https://infura.io](https://infura.io)
- **Sign up:** Email (no credit card)
- **Steps:**
  1. Sign up / Sign in
  2. Click "Create New Key"
  3. Fill in:
     - Key name: `aiforge-ipfs`
     - Network: **IPFS**
  4. Click "Create"
  5. Copy:
     - **Project ID**
     - **Project Secret** (click "View" to reveal)
  6. Save as:
     - `IPFS_HOST` = `ipfs.infura.io`
     - `IPFS_PORT` = `5001`
     - `IPFS_GATEWAY` = `https://ipfs.infura.io/ipfs/`
     - `IPFS_PROJECT_ID` = Your Project ID
     - `IPFS_PROJECT_SECRET` = Your Project Secret

**Alternative: Pinata**
- **URL:** [https://pinata.cloud](https://pinata.cloud)
- **Sign up:** Email (no credit card)
- Free tier: 1 GB storage, unlimited requests
- Get API Key from dashboard

---

## 📝 Environment Variables Checklist

After setting up all services, you should have:

```bash
# ✅ Database
DATABASE_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres

# ✅ Redis
REDIS_URL=redis://default:xxx@xxx.upstash.io:6379

# ✅ Storage (Cloudflare R2)
MINIO_ENDPOINT=xxx.r2.cloudflarestorage.com
MINIO_ACCESS_KEY=xxx
MINIO_SECRET_KEY=xxx

# ✅ IPFS (Infura)
IPFS_HOST=ipfs.infura.io
IPFS_PORT=5001
IPFS_GATEWAY=https://ipfs.infura.io/ipfs/
IPFS_PROJECT_ID=xxx
IPFS_PROJECT_SECRET=xxx

# ⚙️ JWT (Generate random string)
SECRET_KEY=your-very-long-random-secret-key-min-32-characters

# 🌐 CORS (Your frontend URL)
CORS_ORIGINS=["https://your-frontend.vercel.app","http://localhost:5173"]
```

## 🔐 Generate Secret Key

For `SECRET_KEY`, generate a random string:

**Linux/Mac:**
```bash
openssl rand -hex 32
```

**Windows PowerShell:**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

**Online:**
- [https://randomkeygen.com](https://randomkeygen.com) - Use "CodeIgniter Encryption Keys"

## ✅ Next Steps

1. ✅ Set up all services above
2. ✅ Copy all credentials
3. ✅ Deploy to Render (see DEPLOYMENT_GUIDE.md)
4. ✅ Add environment variables in Render dashboard
5. ✅ Update frontend VITE_API_URL in Vercel

---

**Time Required:** ~15 minutes  
**Cost:** $0 (100% free)

