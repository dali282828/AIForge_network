# 🚀 Setup Neo4j (Free)

Quick guide to set up Neo4j for your backend.

## 🎯 Option 1: Neo4j Aura Free (Cloud) - Recommended

**Best for:** Production, cloud deployment

### Steps:
1. Go to [https://neo4j.com/cloud/aura/](https://neo4j.com/cloud/aura/)
2. Click **"Try Free"**
3. Sign up (no credit card required)
4. Create a new instance:
   - Name: `aiforge-network`
   - Region: Choose closest to you
   - Password: (generate and save!)
5. Wait 2-3 minutes for setup
6. Copy connection details:
   - **URI:** `neo4j+s://xxxxx.databases.neo4j.io`
   - **User:** `neo4j`
   - **Password:** (the one you set)
   - **Database:** `neo4j`

### Free Tier Limits:
- ✅ 50,000 nodes
- ✅ 175,000 relationships
- ✅ 2 GB storage
- ✅ No credit card required

---

## 🎯 Option 2: Neo4j Desktop (Local)

**Best for:** Development, testing

### Steps:
1. Download: [https://neo4j.com/download/](https://neo4j.com/download/)
2. Install Neo4j Desktop
3. Create a new database:
   - Click **"Add"** → **"Local DBMS"**
   - Name: `aiforge-network`
   - Password: (set a password)
   - Version: Latest
4. Click **"Start"** to start the database
5. Connection details:
   - **URI:** `bolt://localhost:7687`
   - **User:** `neo4j`
   - **Password:** (the one you set)
   - **Database:** `neo4j`

### Free Tier:
- ✅ Unlimited nodes/relationships
- ✅ Full features
- ✅ Runs on your computer

---

## ⚙️ Environment Variables

Add these to your Vercel environment variables:

### For Neo4j Aura (Cloud):
```bash
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
NEO4J_DATABASE=neo4j
```

### For Neo4j Desktop (Local):
```bash
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
NEO4J_DATABASE=neo4j
```

**Note:** For local development, use `bolt://`  
**Note:** For Aura (cloud), use `neo4j+s://` (secure)

---

## ✅ Verify Connection

After setting up, test the connection:

1. Deploy backend to Vercel
2. Visit: `https://your-backend.vercel.app/health`
3. Check logs for connection status

---

## 📚 Next Steps

1. ✅ Set up Neo4j (choose one option above)
2. ✅ Add environment variables to Vercel
3. ✅ Redeploy backend
4. ✅ Test connection

---

## 🆘 Troubleshooting

### Connection Failed
- Check URI format (bolt:// vs neo4j+s://)
- Verify password is correct
- Check if database is running (for local)

### Authentication Failed
- Verify username is `neo4j`
- Check password is correct
- For Aura, make sure you're using the correct instance

---

**Ready?** Set up Neo4j and add the environment variables!

