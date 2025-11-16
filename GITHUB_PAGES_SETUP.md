# 🚀 GitHub Pages Deployment Setup

## ✅ What I've Done

1. ✅ Updated `frontend/vite.config.ts` to support GitHub Pages base path
2. ✅ Created GitHub Actions workflow (`.github/workflows/deploy-frontend.yml`)
3. ✅ Configured build process with environment variables

## 📋 Steps to Deploy

### Step 1: Enable GitHub Pages in Repository Settings

1. Go to your GitHub repository: `https://github.com/YOUR_USERNAME/AIForge_network`
2. Click **Settings** → **Pages**
3. Under **Source**, select:
   - **Source:** `GitHub Actions`
4. Click **Save**

### Step 2: Add Repository Secret (Optional)

If you want to override the default API URL:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://aiforge-backend.fly.dev/api`
4. Click **Add secret**

### Step 3: Update Repository Name in vite.config.ts

**IMPORTANT:** Update the base path in `frontend/vite.config.ts` to match your repository name:

```typescript
base: process.env.GITHUB_PAGES ? '/YOUR_REPO_NAME/' : '/',
```

Replace `YOUR_REPO_NAME` with your actual repository name (e.g., `AIForge_network`).

### Step 4: Push to GitHub

```bash
git add .
git commit -m "Setup GitHub Pages deployment"
git push origin main
```

### Step 5: Wait for Deployment

1. Go to **Actions** tab in your GitHub repository
2. Wait for the workflow to complete
3. Your site will be available at:
   - `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

### Step 6: Update CORS in Fly.io

After deployment, update CORS_ORIGINS in Fly.io to include your GitHub Pages URL:

```bash
flyctl secrets set CORS_ORIGINS="https://YOUR_USERNAME.github.io,https://aiforge-network.vercel.app,http://localhost:5173" --app aiforge-backend
```

## 🔧 Configuration

### Current Setup:
- **Build Command:** `npm run build` (in frontend directory)
- **Output Directory:** `frontend/dist`
- **Base Path:** `/AIForge_network/` (update if different)
- **API URL:** `https://aiforge-backend.fly.dev/api` (default)

## 📝 Notes

- GitHub Pages is **free** and works great for static sites
- The workflow automatically deploys on every push to `main` branch
- You can also manually trigger deployment from the **Actions** tab
- The frontend will be served from a subpath (e.g., `/AIForge_network/`)

## 🐛 Troubleshooting

If the site doesn't load:
1. Check the **Actions** tab for build errors
2. Verify the base path matches your repository name
3. Make sure GitHub Pages is enabled in repository settings
4. Check that the workflow completed successfully

