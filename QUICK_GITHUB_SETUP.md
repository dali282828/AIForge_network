# ⚡ Quick GitHub Pages Setup (3 Steps)

## ✅ Already Done
- ✅ Git repository initialized
- ✅ All files committed
- ✅ GitHub Actions workflow configured
- ✅ Auto-detects repository name

## 🚀 3 Simple Steps

### Step 1: Create GitHub Repository
1. Go to: **https://github.com/new**
2. Repository name: `AIForge_network` (or any name you want)
3. Choose **Public** or **Private**
4. **DO NOT** check any boxes (no README, .gitignore, license)
5. Click **"Create repository"**

### Step 2: Push Code
Copy and paste these commands (replace `YOUR_USERNAME` with your GitHub username):

```bash
cd C:\Users\asus\AIForge_network
git remote add origin https://github.com/YOUR_USERNAME/AIForge_network.git
git push -u origin main
```

### Step 3: Enable GitHub Pages
1. Go to your repository on GitHub
2. Click **Settings** → **Pages** (left sidebar)
3. Under **Source**, select: **"GitHub Actions"**
4. Click **Save**

## 🎉 Done!

The workflow will automatically:
- Build your frontend
- Deploy to GitHub Pages
- Your site will be at: `https://YOUR_USERNAME.github.io/AIForge_network/`

## 🔧 After Deployment

Update CORS in Fly.io to allow your GitHub Pages URL:

```bash
cd backend
flyctl secrets set CORS_ORIGINS="https://YOUR_USERNAME.github.io,https://aiforge-network.vercel.app,http://localhost:5173" --app aiforge-backend
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## ⏱️ First Deployment

- Takes 2-3 minutes
- Check progress in **Actions** tab
- Once complete, your site will be live!

