# 🚀 AIForge Network - Deployment Guide

Complete guide to deploy AIForge Network to production using **100% free services** (no credit card required).

## 📚 Documentation Files

1. **QUICK_START.md** - Fast 5-minute deployment guide
2. **SETUP_FREE_SERVICES.md** - Detailed setup for all free services
3. **DEPLOYMENT_GUIDE.md** - Complete step-by-step deployment instructions

## 🎯 Quick Overview

### Architecture
```
Frontend (Vercel) 
    ↓
Backend (Render)
    ↓
├── Database (Supabase/Neon)
├── Redis (Upstash)
├── Storage (Cloudflare R2)
└── IPFS (Infura/Pinata)
```

### Services Used (All Free)
- ✅ **Vercel** - Frontend hosting
- ✅ **Render** - Backend hosting
- ✅ **Supabase** - PostgreSQL database
- ✅ **Upstash** - Redis cache
- ✅ **Cloudflare R2** - Object storage
- ✅ **Infura** - IPFS gateway

### Cost
**$0/month** - 100% free tier

## ⚡ Quick Start

1. **Read:** [QUICK_START.md](QUICK_START.md) (5 minutes)
2. **Set up services:** [SETUP_FREE_SERVICES.md](SETUP_FREE_SERVICES.md) (15 minutes)
3. **Deploy:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) (10 minutes)

**Total time:** ~30 minutes

## 📋 Prerequisites

- GitHub account
- Email address
- 30 minutes

## 🔧 Configuration Files

- **render.yaml** - Render deployment configuration
- **backend/Dockerfile** - Backend container configuration
- **backend/.env.example** - Environment variables template

## 📝 Environment Variables

All required environment variables are documented in:
- `backend/.env.example` - Local development
- `DEPLOYMENT_GUIDE.md` - Production deployment

## 🐛 Troubleshooting

See **DEPLOYMENT_GUIDE.md** → Troubleshooting section

## 📞 Support

- Check logs in Render dashboard
- Check logs in Vercel dashboard
- Review service status pages

---

**Ready to deploy?** Start with [QUICK_START.md](QUICK_START.md)!

