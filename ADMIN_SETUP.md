# Admin Wallet Setup Guide

## Issue: "[object Object]" Error

The error occurs because:
1. Admin endpoints require special wallet headers (`x-wallet-address`, `x-wallet-network`)
2. The frontend wasn't properly handling admin wallet verification
3. Admin status wasn't being returned in the login response

## ✅ Fixed

1. **Added admin check endpoint**: `/api/auth/check-admin`
2. **Updated wallet login**: Now returns `is_admin` status
3. **Created Admin page**: `/admin` route with proper wallet connection
4. **Fixed error handling**: Proper error messages instead of "[object Object]"

## 🔧 Setup Your Admin Wallet

### Step 1: Add Admin Wallet to .env

Edit `backend/.env` and add your Tron wallet address:

```env
ADMIN_WALLETS=TEbzWuv1SoXKtA1tnpVMY1TewKW6D4mTRg
```

For multiple wallets (comma-separated):
```env
ADMIN_WALLETS=TEbzWuv1SoXKtA1tnpVMY1TewKW6D4mTRg,0x68eA7071643D1A2c8976f116dd82BBfC031fEA07
```

### Step 2: Restart Backend

```powershell
# Stop backend (Ctrl+C)
# Then restart
cd backend
.\venv\Scripts\uvicorn.exe app.main:app --reload
```

### Step 3: Access Admin Dashboard

1. Go to http://localhost:5173/admin
2. Connect your TronLink wallet
3. The page will automatically check if your wallet is admin
4. If admin, you'll see the admin dashboard

## 📋 Admin Features

Once connected as admin, you can:
- View platform statistics
- Manage admin wallets
- View revenue reports
- Access all admin endpoints

## 🔍 Verify Admin Status

You can check admin status via API:

```bash
GET /api/auth/check-admin?wallet_address=YOUR_ADDRESS&network=tron
```

## ⚠️ Important Notes

- Admin wallets must be in `ADMIN_WALLETS` in `.env`
- Tron addresses are case-sensitive
- Ethereum addresses are automatically lowercased
- Admin endpoints require wallet headers, not just JWT tokens

