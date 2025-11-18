# Frontend Deployment to Vercel

This guide explains how to deploy the AIForge frontend to Vercel.

## Prerequisites

- Node.js and npm installed
- Vercel account (sign up at https://vercel.com)
- Git repository (optional, but recommended)

## Quick Deploy (Vercel CLI)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

4. **Deploy to production**:
   ```bash
   vercel --prod
   ```

   Follow the prompts:
   - Link to existing project? (Y/n) - Choose based on your preference
   - Project name: `aiforge-frontend` (or your preferred name)
   - Directory: `./` (current directory)
   - Override settings? (y/N) - N (use vercel.json)

5. **Your site will be deployed!** You'll get a URL like `https://aiforge-frontend.vercel.app`

## Deploy via Vercel Dashboard

1. **Go to Vercel Dashboard**: https://vercel.com/new

2. **Import your Git repository**:
   - Connect your GitHub/GitLab/Bitbucket account
   - Select the repository containing this frontend

3. **Configure the project**:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Environment Variables** (if needed):
   - `VITE_API_URL`: Optional - defaults to `https://aiforge-backend.fly.dev/api`
   - Only set this if you want to override the default backend URL

5. **Deploy**: Click "Deploy"

## Configuration

The `vercel.json` file is already configured with:
- ✅ Build command: `npm run build`
- ✅ Output directory: `dist`
- ✅ Framework: `vite`
- ✅ SPA routing (all routes redirect to index.html)
- ✅ Security headers

## API Configuration

The frontend automatically detects the environment:
- **Localhost**: Uses `http://localhost:8000/api`
- **Production**: Uses `https://aiforge-backend.fly.dev/api`
- **Custom**: Set `VITE_API_URL` environment variable in Vercel

## Updates

After deploying, any future updates can be deployed by:

1. **Via CLI**:
   ```bash
   cd frontend
   vercel --prod
   ```

2. **Via Git** (if connected):
   - Push changes to your repository
   - Vercel will automatically deploy

## Troubleshooting

- **Build fails**: Check that all dependencies are in `package.json`
- **API errors**: Verify backend is accessible at `https://aiforge-backend.fly.dev`
- **Routing issues**: Ensure `vercel.json` has the rewrite rules for SPA routing

## Recent Updates

This deployment includes:
- ✅ Auto-refreshing Nodes page (updates every 10 seconds)
- ✅ Improved node status detection (2-minute threshold)
- ✅ Real-time status updates
- ✅ Enhanced Electron app integration

