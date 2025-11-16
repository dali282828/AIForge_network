# Wallet-Based Authentication System

## Overview

Users can now sign in using their wallet addresses (MetaMask/TronLink) instead of email/password, similar to how admin access works. This provides a decentralized authentication method.

## Features

### 1. Wallet Login/Registration
- Users can sign in with wallet address + signature
- Automatic account creation for new wallets
- No email/password required for wallet-only users
- Supports both Ethereum (MetaMask) and Tron (TronLink)

### 2. Dual Authentication Methods
- **Email/Password**: Traditional authentication (still available)
- **Wallet**: Decentralized authentication (new)

### 3. User Account Types
- **Email users**: Have email, username, password
- **Wallet users**: Have wallet address, optional email/username
- Users can have both methods (connect wallet to email account)

## API Endpoints

### 1. Get Authentication Message
```
GET /api/auth/wallet/auth-message?wallet_address=0x...&network=ethereum
```

**Response:**
```json
{
  "message": "AIForge Network\n\nSign in with wallet\n\nWallet: 0x...\nTimestamp: 1234567890\nNonce: abc123...",
  "wallet_address": "0x...",
  "timestamp": 1234567890
}
```

### 2. Wallet Login/Register
```
POST /api/auth/wallet/login
```

**Request:**
```json
{
  "wallet_address": "0x68eA7071643D1A2c8976f116dd82BBfC031fEA07",
  "network": "ethereum",
  "wallet_type": "metamask",
  "signature": "0x...",
  "message": "AIForge Network\n\nSign in with wallet\n\n...",
  "email": "optional@example.com",
  "username": "optional_username",
  "full_name": "Optional Name"
}
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user_id": 123
}
```

## User Flow

### First Time (New Wallet)
1. User connects wallet (MetaMask/TronLink)
2. Frontend requests auth message: `GET /api/auth/wallet/auth-message`
3. User signs message with wallet
4. Frontend sends signature: `POST /api/auth/wallet/login`
5. Backend creates user account automatically
6. Returns JWT token
7. User is logged in

### Returning User (Existing Wallet)
1. User connects wallet
2. Frontend requests auth message
3. User signs message
4. Frontend sends signature
5. Backend finds existing user by wallet address
6. Returns JWT token
7. User is logged in

## Database Changes

### User Model Updates
- `email`: Now nullable (optional for wallet-only users)
- `username`: Now nullable (optional for wallet-only users)
- `hashed_password`: Now nullable (optional for wallet-only users)
- `auth_method`: New field ("email" or "wallet")

### Migration
- Migration `005_update_user_for_wallet_auth` updates User table

## Frontend Integration

### Example: MetaMask Login
```javascript
// 1. Get auth message
const response = await fetch(
  `/api/auth/wallet/auth-message?wallet_address=${address}&network=ethereum`
);
const { message } = await response.json();

// 2. Sign message with MetaMask
const signature = await window.ethereum.request({
  method: 'personal_sign',
  params: [message, address]
});

// 3. Login with signature
const loginResponse = await fetch('/api/auth/wallet/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    wallet_address: address,
    network: 'ethereum',
    wallet_type: 'metamask',
    signature: signature,
    message: message
  })
});

const { access_token, user_id } = await loginResponse.json();
// Store token and use for authenticated requests
```

### Example: TronLink Login
```javascript
// 1. Get auth message
const response = await fetch(
  `/api/auth/wallet/auth-message?wallet_address=${address}&network=tron`
);
const { message } = await response.json();

// 2. Sign message with TronLink
const signature = await window.tronWeb.trx.signMessage(message);

// 3. Login with signature
const loginResponse = await fetch('/api/auth/wallet/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    wallet_address: address,
    network: 'tron',
    wallet_type: 'tronlink',
    signature: signature,
    message: message
  })
});

const { access_token, user_id } = await loginResponse.json();
```

## Security Notes

### Current Implementation
- Signature verification is a placeholder (returns `True` if signature provided)
- **TODO**: Implement proper cryptographic verification:
  - Ethereum: Use `web3.py` to recover address from signature
  - Tron: Use `tronpy` to verify signature

### Production Requirements
1. **Proper Signature Verification**: Verify signature cryptographically
2. **Message Expiry**: Add timestamp validation (e.g., 5 minutes)
3. **Nonce Replay Protection**: Store used nonces to prevent replay attacks
4. **Rate Limiting**: Limit login attempts per wallet address

## Benefits

1. **Decentralized**: No password management
2. **Secure**: Cryptographic proof of wallet ownership
3. **User-Friendly**: One-click login with wallet
4. **Flexible**: Users can use email OR wallet
5. **Web3 Native**: Aligns with decentralized platform vision

## Migration Path

### Existing Users
- Can continue using email/password
- Can connect wallet to existing account
- Can switch to wallet-only authentication

### New Users
- Can choose email/password OR wallet
- Wallet-only users don't need email
- Automatic account creation on first wallet login

## Next Steps

1. **Implement Proper Signature Verification**
   - Add `web3.py` for Ethereum
   - Add `tronpy` for Tron
   - Verify signatures cryptographically

2. **Add Message Expiry**
   - Validate timestamp in auth message
   - Reject expired messages

3. **Add Nonce Tracking**
   - Store used nonces in database
   - Prevent replay attacks

4. **Frontend Integration**
   - Add wallet connection UI
   - Add "Sign in with Wallet" button
   - Handle MetaMask/TronLink connection

## Files Modified

- `backend/app/models/user.py` - Made email/username/password nullable, added auth_method
- `backend/app/api/auth.py` - Added wallet login endpoints
- `backend/app/schemas/auth.py` - Added wallet login schemas
- `backend/app/services/wallet_service.py` - Added auth message generation
- `backend/alembic/versions/005_update_user_for_wallet_auth.py` - Migration

