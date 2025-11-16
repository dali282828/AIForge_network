# 🧪 Test Database Connection

Quick guide to test your Neon database connection.

## ✅ Step 1: Add DATABASE_URL to Vercel

1. Go to: https://vercel.com/dalicursor-4767s-projects/backend/settings/environment-variables
2. Click **"Add New"**
3. Add:
   - **Key:** `DATABASE_URL`
   - **Value:** `postgresql://neondb_owner:npg_VA0zCZBp2fmX@ep-wandering-cherry-ablwohlv-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require`
4. Click **Save**

## ✅ Step 2: Redeploy Backend

```bash
cd backend
vercel --prod
```

Or redeploy from Vercel dashboard:
1. Go to your backend project
2. Click **"Deployments"** tab
3. Click **"..."** on latest deployment
4. Click **"Redeploy"**

## ✅ Step 3: Test Health Endpoint

Visit: `https://backend-ln1rviy2l-dalicursor-4767s-projects.vercel.app/health`

**Expected Response:**
```json
{"status": "healthy"}
```

## ✅ Step 4: Test Database Connection

Visit: `https://backend-ln1rviy2l-dalicursor-4767s-projects.vercel.app/`

**Expected Response:**
```json
{"message": "AIForge Network API", "version": "0.1.0"}
```

## ✅ Step 5: Check Logs

1. Go to Vercel Dashboard → Your Backend Project
2. Click **"Deployments"** tab
3. Click on latest deployment
4. Click **"Functions"** tab
5. Check logs for:
   - ✅ "Neo4j connection established" (if using Neo4j)
   - ✅ Database connection errors
   - ✅ Migration status

## 🐛 Troubleshooting

### Connection Failed
- Check if `DATABASE_URL` is correct
- Verify password is correct
- Check if database is accessible

### Migration Errors
- Check logs for specific error
- Verify database has proper permissions
- Try running migrations manually

### Timeout Errors
- Vercel has 10 second limit
- Database might be slow to connect
- Check Neon dashboard for database status

## ✅ Success Indicators

- ✅ Health endpoint returns `{"status": "healthy"}`
- ✅ No errors in deployment logs
- ✅ Database migrations run successfully
- ✅ API responds correctly

---

**Once database is working, we'll set up:**
1. Redis (Upstash)
2. IPFS (Infura)
3. Storage (Cloudflare R2)

