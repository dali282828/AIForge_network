# 🚀 Neon PostgreSQL Setup

Your Neon database is ready! Here's how to configure it.

## ✅ Your Neon Credentials

```bash
DATABASE_URL='postgresql://neondb_owner:npg_VA0zCZBp2fmX@ep-wandering-cherry-ablwohlv-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require'
```

## 🔧 Step 1: Add to Vercel Environment Variables

1. Go to Vercel Dashboard: https://vercel.com/dalicursor-4767s-projects/backend/settings/environment-variables
2. Add this environment variable:

**Key:** `DATABASE_URL`  
**Value:** `postgresql://neondb_owner:npg_VA0zCZBp2fmX@ep-wandering-cherry-ablwohlv-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require`

3. Click **Save**

## 🔧 Step 2: Run Database Migrations

After deploying, the backend will automatically run migrations on startup (configured in Dockerfile).

Or manually run migrations:

```bash
cd backend
alembic upgrade head
```

## ✅ Step 3: Verify Connection

1. Deploy backend to Vercel
2. Visit: `https://your-backend.vercel.app/health`
3. Check logs for database connection status

## 📊 Neon Free Tier

- ✅ **3 GB database storage**
- ✅ **Unlimited projects**
- ✅ **Branching** (like Git for databases)
- ✅ **No credit card required**
- ✅ **Auto-scaling**

## 🔐 Security Notes

- ✅ Connection uses SSL (`sslmode=require`)
- ✅ Credentials are stored securely in Vercel
- ✅ Never commit credentials to Git

## 🎉 You're Ready!

Your backend is now configured to use Neon PostgreSQL. Just add the `DATABASE_URL` to Vercel and redeploy!

---

**Next Steps:**
1. ✅ Add `DATABASE_URL` to Vercel
2. ✅ Redeploy backend
3. ✅ Test connection

