# AIForge Network - Complete Platform Guide

## 📋 Table of Contents
1. [Platform Overview](#platform-overview)
2. [User Roles](#user-roles)
3. [How Users Work](#how-users-work)
4. [How Miners/Nodes Work](#how-minersnodes-work)
5. [How Admin Works](#how-admin-works)
6. [Complete Workflows](#complete-workflows)
7. [Revenue System](#revenue-system)
8. [Payment Flows](#payment-flows)
9. [Database Schema](#database-schema)
10. [API Endpoints Summary](#api-endpoints-summary)

---

## Platform Overview

**AIForge Network** is a decentralized social platform for collaborative AI model development where:
- **Users** can upload, share, and monetize AI models
- **Miners/Nodes** provide compute power and earn USDT
- **Admins** manage the platform and receive platform fees
- **Groups** collaborate on model development
- **Marketplace** allows buying/selling model APIs
- **Chat Application** provides ChatGPT-like interface

---

## User Roles

### 1. Regular Users
**Who they are:**
- Anyone who registers on the platform
- Can be model creators, API consumers, or both

**What they can do:**
- Upload models
- Create groups
- Join groups
- Publish models (pay fees)
- Create API services
- Subscribe to models/APIs
- Use chat application
- Earn revenue from their models

**Authentication:**
- Email/Password OR
- Wallet (MetaMask/TronLink)

**Permissions:**
- Create/edit/delete their own models
- Manage their own groups
- Subscribe to marketplace services
- Access chat application

---

### 2. Miners/Nodes
**Who they are:**
- Users who run compute nodes
- Provide GPU/CPU resources
- Execute training/inference jobs

**What they can do:**
- Register as a node
- Receive job assignments
- Execute jobs (training, inference, etc.)
- Earn USDT for completed jobs
- Monitor resource usage

**How it works:**
1. Install node client software
2. Register node with coordinator
3. Send heartbeat (status updates)
4. Poll for available jobs
5. Execute jobs in Docker containers
6. Upload results to IPFS
7. Get paid in USDT

**Earnings:**
- Receive 90-95% of job payment
- Platform takes 5% fee
- Direct USDT payments

**Requirements:**
- Docker installed
- GPU/CPU resources
- Internet connection
- Node client software

---

### 3. Admin
**Who they are:**
- Platform owner/operator
- You (wallet whitelisted)

**What they can do:**
- View platform statistics
- Manage users
- Manage nodes
- View all payments
- View revenue reports
- Add/remove admin wallets
- Configure platform settings

**Authentication:**
- Wallet-based (MetaMask/TronLink)
- Wallet address must be in whitelist
- No password needed

**Access:**
- All admin endpoints
- Platform dashboard
- Revenue analytics
- User/node management

**Revenue:**
- 30% of subscription revenue
- 5% of job payments
- 5% of model sales
- 10% of API subscriptions
- 100% of publishing fees ($5/model)
- 100% of listing fees ($2/month/model)

---

## How Users Work

### User Registration & Authentication

#### Option 1: Email/Password
```
1. User registers with email, username, password
2. Account created
3. User logs in with email/password
4. Receives JWT token
5. Can connect wallet later
```

#### Option 2: Wallet Authentication
```
1. User connects wallet (MetaMask/TronLink)
2. Backend generates authentication message
3. User signs message with wallet
4. Backend verifies signature
5. Account created automatically (if new)
6. Receives JWT token
7. No email/password needed
```

### User Workflows

#### A. Model Creator Workflow

**1. Upload Model**
```
1. User creates/joins a group
2. Uploads model file (or imports from HuggingFace)
3. Model stored in IPFS (decentralized) + MinIO (fast access)
4. Model metadata saved to database
```

**2. Publish Model**
```
1. User wants to publish model
2. Checks if first model (free) or needs to pay $5
3. If not first: Creates payment for $5 publishing fee
4. Sends USDT to platform wallet
5. Verifies transaction
6. Model status changes to PUBLISHED
7. Model appears in marketplace
```

**3. Keep Model Listed**
```
1. User must pay $2/month listing fee
2. Creates payment for listing fee
3. Sends USDT to platform wallet
4. Verifies transaction
5. Listing period extended by 30 days
6. If not paid: Model delisted after 7-day grace period
```

**4. Create API Service**
```
1. User creates API service for their model
2. Sets pricing (subscription or pay-per-request)
3. Service appears in marketplace
4. Users can subscribe to use the API
```

**5. Earn Revenue**
```
1. Users subscribe to model's API
2. Revenue generated from subscriptions + usage
3. Platform takes 30% (subscriptions) or 10% (API)
4. Model creator gets 70% (subscriptions) or 90% (API)
5. If group model: Revenue split among members
```

#### B. API Consumer Workflow

**1. Subscribe to Platform**
```
1. User connects wallet
2. Chooses subscription plan (Free, Basic $10, Pro $30, Enterprise $100)
3. Creates payment for subscription
4. Sends USDT to platform wallet
5. Verifies transaction
6. Subscription activated
7. Can now use chat app + API access
```

**2. Subscribe to Model API**
```
1. User browses marketplace
2. Finds model API they want
3. Subscribes to API service
4. Pays monthly fee (if subscription-based)
5. Receives API key
6. Can use API in their apps or chat
```

**3. Use Chat Application**
```
1. User opens chat web UI
2. Selects model from marketplace
3. Starts chatting
4. Messages sent to OpenAI-compatible API
5. Model processes and responds
6. Conversation saved
```

**4. Use API in Apps**
```
1. User gets API key from subscription
2. Uses API key with OpenAI-compatible clients
3. Makes requests to /api/v1/chat/completions
4. Works with Continue.dev, custom apps, etc.
```

#### C. Group Collaboration Workflow

**1. Create/Join Group**
```
1. User creates group OR joins existing group
2. Group has roles: OWNER, ADMIN, MEMBER, VIEWER
3. Members can collaborate on models
```

**2. Group Model Development**
```
1. Group members upload models to group
2. Model owned by group
3. Revenue split configured by model owner
4. Example: {User1: 50%, User2: 30%, User3: 20%}
```

**3. Revenue Distribution**
```
1. Model generates revenue
2. Platform takes 30% (subscriptions) or 10% (API)
3. Remaining 70% or 90% split among group members
4. Distribution based on configured percentages
5. Each member receives their share
```

---

## How Miners/Nodes Work

### Node Registration

**1. Setup Node**
```
1. Install node client software
2. Configure node settings (name, resources, etc.)
3. Get authentication token (optional)
4. Start node client
```

**2. Register with Coordinator**
```
1. Node sends registration request
2. Coordinator creates node record
3. Node receives node_id
4. Node starts sending heartbeats
```

### Node Operations

**1. Heartbeat System**
```
Every 30 seconds (configurable):
1. Node sends heartbeat to coordinator
2. Includes: CPU, GPU, memory, disk usage
3. Coordinator updates node status
4. If no heartbeat for 5 minutes: Node marked inactive
```

**2. Job Polling**
```
Every 10 seconds (configurable):
1. Node polls coordinator for available jobs
2. Coordinator checks:
   - Jobs in PENDING status
   - Node has required resources (GPU, CPU, memory)
   - Node not at max concurrent jobs
3. If job available: Assign to node
4. Node receives job details
```

**3. Job Execution**
```
1. Node receives job assignment
2. Downloads input files from IPFS
3. Creates Docker container
4. Runs job command
5. Monitors progress
6. Uploads results to IPFS
7. Updates job status
8. Reports completion to coordinator
```

**4. Payment**
```
1. Job creator pays for job
2. Payment verified on blockchain
3. Node receives 90-95% of payment
4. Platform takes 5% fee
5. Payment sent to node's wallet
```

### Node Types

**GPU Nodes:**
- Required for training jobs
- Required for inference on large models
- Higher earning potential
- More expensive to run

**CPU Nodes:**
- Can handle smaller inference jobs
- Lower earning potential
- Cheaper to run

---

## How Admin Works

### Admin Authentication

**Wallet-Based Access:**
```
1. Admin connects wallet (MetaMask/TronLink)
2. Wallet address checked against whitelist
3. If whitelisted: Access granted
4. No password needed
5. Signature verification (for production)
```

**Admin Wallet Whitelist:**
- Stored in database (`admin_wallets` table)
- Can also be in `.env` file
- Your wallets: 
  - Ethereum: `0x68eA7071643D1A2c8976f116dd82BBfC031fEA07`
  - Tron: `TEbzWuv1SoXKtA1tnpVMY1TewKW6D4mTRg`

### Admin Capabilities

**1. Platform Statistics**
```
- Total users
- Active users
- Total subscriptions
- Active subscriptions
- Total payments
- Platform revenue
- Node statistics
- Job statistics
- Model statistics
```

**2. User Management**
```
- View all users
- View user details
- Deactivate users
- View user wallets
- View user subscriptions
```

**3. Node Management**
```
- View all nodes
- View node status
- View node resources
- Activate/deactivate nodes
- View node job history
```

**4. Payment Management**
```
- View all payments
- View payment history
- Verify transactions
- Track platform fees
- View revenue by type
```

**5. Revenue Management**
```
- View platform revenue summary
- View monthly revenue breakdowns
- View revenue distribution
- Track model creator earnings
- Monitor platform fees
```

**6. Admin Wallet Management**
```
- Add admin wallets to whitelist
- Remove admin wallets
- View all admin wallets
- Manage access control
```

### Admin Revenue

**Platform Fees Received:**
```
1. Subscription Revenue: 30% → Your wallet
2. Job Payments: 5% → Your wallet
3. Model Sales: 5% → Your wallet
4. API Subscriptions: 10% → Your wallet
5. Publishing Fees: 100% ($5/model) → Your wallet
6. Listing Fees: 100% ($2/month/model) → Your wallet
```

**Example Monthly Revenue:**
```
- 100 users × $30/month = $3,000
- Platform fee (30%) = $900 → Your wallet
- 50 models × $2/month = $100 → Your wallet
- 20 new models × $5 = $100 → Your wallet
- Total: ~$1,100/month → Your wallet
```

---

## Complete Workflows

### Workflow 1: User Publishes Model and Earns Revenue

```
Step 1: User Registration
├─ User registers with email OR wallet
└─ Account created

Step 2: Upload Model
├─ User uploads model file
├─ Model stored in IPFS + MinIO
└─ Model metadata saved

Step 3: Publish Model
├─ User pays $5 publishing fee (first model free)
├─ USDT sent to platform wallet
├─ Transaction verified
└─ Model status: PUBLISHED

Step 4: Create API Service
├─ User creates API service for model
├─ Sets pricing (e.g., $10/month subscription)
└─ Service appears in marketplace

Step 5: Users Subscribe
├─ Other users subscribe to API
├─ Pay $10/month
├─ Platform takes 30% = $3 → Your wallet
└─ Model creator gets 70% = $7

Step 6: Monthly Listing Fee
├─ User pays $2/month to keep model listed
├─ USDT sent to platform wallet
└─ Listing period extended
```

### Workflow 2: Group Model Development and Revenue Split

```
Step 1: Create Group
├─ User creates group
├─ Adds members
└─ Sets roles

Step 2: Upload Group Model
├─ Group member uploads model
├─ Model owned by group
└─ Model published

Step 3: Configure Revenue Split
├─ Model owner sets split: {User1: 50%, User2: 30%, User3: 20%}
└─ Split saved to database

Step 4: Model Generates Revenue
├─ Users subscribe to model API
├─ Revenue: $100/month
├─ Platform takes 30% = $30 → Your wallet
└─ Model pool: 70% = $70

Step 5: Revenue Distribution
├─ $70 split among group members:
│   ├─ User1: $35 (50%)
│   ├─ User2: $21 (30%)
│   └─ User3: $14 (20%)
└─ Each member receives their share
```

### Workflow 3: User Subscribes and Uses Chat

```
Step 1: Connect Wallet
├─ User connects MetaMask/TronLink
├─ Wallet verified
└─ Wallet linked to account

Step 2: Subscribe to Platform
├─ User chooses plan (e.g., Pro $30/month)
├─ Creates payment
├─ Sends $30 USDT to platform wallet
├─ Platform takes 30% = $9 → Your wallet
└─ Subscription activated

Step 3: Browse Marketplace
├─ User browses available models
├─ Selects model API
└─ Subscribes to API (if needed)

Step 4: Use Chat Application
├─ User opens chat web UI
├─ Selects model
├─ Starts chatting
├─ Messages sent to API
└─ Model responds

Step 5: Use API in Apps
├─ User gets API key
├─ Uses with Continue.dev or custom app
└─ Makes API requests
```

### Workflow 4: Miner Executes Job and Gets Paid

```
Step 1: Node Registration
├─ Miner installs node client
├─ Registers with coordinator
└─ Node active

Step 2: Job Created
├─ User creates training job
├─ Job status: PENDING
└─ Job waits for available node

Step 3: Job Assignment
├─ Node polls for jobs
├─ Coordinator assigns job to node
├─ Job status: ASSIGNED
└─ Node receives job details

Step 4: Job Execution
├─ Node downloads input files from IPFS
├─ Creates Docker container
├─ Runs training command
├─ Job status: RUNNING
├─ Monitors progress
└─ Uploads results to IPFS

Step 5: Job Completion
├─ Job status: COMPLETED
├─ Results available on IPFS
└─ User notified

Step 6: Payment
├─ User pays for job ($X USDT)
├─ Platform takes 5% = $0.05X → Your wallet
├─ Node receives 95% = $0.95X
└─ Payment sent to node's wallet
```

---

## Revenue System

### Revenue Sources

**1. Subscription Revenue**
```
User pays: $30/month
├─ Platform fee (30%): $9 → Your wallet
└─ Model pool (70%): $21 → Distributed to model creators
```

**2. API Subscription Revenue**
```
User subscribes to model API: $10/month
├─ Platform fee (10%): $1 → Your wallet
└─ Model creator (90%): $9 → Model owner or group split
```

**3. Job Payments**
```
User pays for job: $100
├─ Platform fee (5%): $5 → Your wallet
└─ Node (95%): $95 → Miner's wallet
```

**4. Model Sales**
```
User buys model: $50
├─ Platform fee (5%): $2.50 → Your wallet
└─ Seller (95%): $47.50 → Model owner
```

**5. Publishing Fees**
```
User publishes model: $5
└─ 100% → Your wallet ($5)
```

**6. Listing Fees**
```
User keeps model listed: $2/month
└─ 100% → Your wallet ($2/month per model)
```

### Revenue Distribution Flow

**Subscription Revenue Distribution:**
```
Total Subscription Revenue: $1,000/month
├─ Platform Fee (30%): $300 → Your wallet ✅
└─ Model Pool (70%): $700 → Distributed by usage
    ├─ Model A (40% usage): $280
    │   └─ If group model: Split among members
    ├─ Model B (30% usage): $210
    ├─ Model C (20% usage): $140
    └─ Model D (10% usage): $70
```

**API Usage Revenue Distribution:**
```
API Usage Revenue: $100
├─ Platform Fee (10%): $10 → Your wallet ✅
└─ Net Revenue (90%): $90
    └─ If group model: Split among members
        ├─ User1 (50%): $45
        ├─ User2 (30%): $27
        └─ User3 (20%): $18
```

---

## Payment Flows

### Payment Types

**1. Subscription Payment**
```
User → Pays $30 USDT → Platform Wallet
├─ Platform keeps 30% = $9
└─ Model pool gets 70% = $21
```

**2. Publishing Fee Payment**
```
User → Pays $5 USDT → Platform Wallet
└─ 100% to platform = $5
```

**3. Listing Fee Payment**
```
User → Pays $2 USDT → Platform Wallet
└─ 100% to platform = $2
```

**4. API Subscription Payment**
```
User → Pays $10 USDT → Platform Wallet
├─ Platform keeps 10% = $1
└─ Model creator gets 90% = $9
```

**5. Job Payment**
```
User → Pays $100 USDT → Platform Wallet
├─ Platform keeps 5% = $5
└─ Node gets 95% = $95
```

### Payment Verification

**Process:**
```
1. User creates payment record
2. User sends USDT transaction
3. User provides transaction hash
4. Backend verifies transaction on blockchain
5. Checks confirmations (3 for Ethereum, 19 for Tron)
6. Payment status: CONFIRMED
7. Service/product activated
```

---

## Database Schema

### Core Tables

**users**
- User accounts
- Email/username (optional for wallet users)
- Authentication method (email/wallet)

**groups**
- Collaboration groups
- Owner, name, description

**group_memberships**
- Group members and roles
- Roles: OWNER, ADMIN, MEMBER, VIEWER

**models**
- AI models
- IPFS CID, MinIO path
- Owner, group, metadata

**nodes**
- Compute nodes (miners)
- Resources, status, statistics

**jobs**
- Training/inference jobs
- Status, configuration, results

### Payment & Subscription Tables

**user_wallets**
- Connected wallets
- Network, type, verification status

**admin_wallets**
- Admin whitelist
- Wallet addresses with admin access

**payments**
- All payment transactions
- Type, amount, fees, status
- Blockchain transaction details

**subscriptions**
- User subscriptions
- Plan, status, limits

### Marketplace Tables

**api_services**
- API services for models
- Pricing, rate limits, statistics

**api_subscriptions**
- User API subscriptions
- API keys, credits, limits

**api_requests**
- API usage tracking
- Tokens, costs, requests

### Publishing Tables

**model_publishing**
- Publishing status
- Fees paid, listing period

**group_revenue_splits**
- Revenue split configuration
- Percentages per member

**revenue_distributions**
- Revenue distribution history
- Period, amounts, distribution details

---

## API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Register (email/password)
- `POST /api/auth/login` - Login (email/password)
- `POST /api/auth/wallet/login` - Login with wallet
- `GET /api/auth/wallet/auth-message` - Get auth message
- `GET /api/auth/me` - Get current user

### Wallets
- `POST /api/wallets/connect` - Connect wallet
- `POST /api/wallets/verify` - Verify wallet
- `GET /api/wallets/my-wallets` - Get user's wallets

### Payments
- `POST /api/payments/create` - Create payment
- `POST /api/payments/verify` - Verify transaction
- `GET /api/payments/{id}` - Get payment
- `GET /api/payments/history/all` - Payment history

### Subscriptions
- `GET /api/subscriptions/plans` - Get plans
- `POST /api/subscriptions/create` - Create subscription
- `GET /api/subscriptions/my-subscription` - Get user's subscription
- `POST /api/subscriptions/cancel` - Cancel subscription

### Publishing
- `GET /api/publishing/model/{id}/publishing` - Get publishing info
- `POST /api/publishing/model/{id}/publish` - Pay publishing fee
- `POST /api/publishing/model/{id}/listing-fee` - Pay listing fee

### Group Revenue
- `POST /api/group-revenue/model/{id}/split` - Configure split
- `GET /api/group-revenue/model/{id}/split` - Get split config
- `GET /api/group-revenue/model/{id}/distribution/{year}/{month}` - Get distribution
- `POST /api/group-revenue/model/{id}/distribute/{year}/{month}` - Distribute revenue
- `GET /api/group-revenue/my-group-earnings` - Get user's group earnings

### Marketplace
- `POST /api/marketplace/create` - Create API service
- `GET /api/marketplace/marketplace` - Browse services
- `POST /api/marketplace/{id}/subscribe` - Subscribe to service
- `GET /api/marketplace/my-subscriptions` - Get user's subscriptions

### OpenAI-Compatible API
- `POST /api/v1/chat/completions` - Chat completions
- `GET /api/v1/models` - List models

### Revenue (Admin)
- `GET /api/revenue/summary` - Platform revenue
- `GET /api/revenue/monthly/{year}/{month}` - Monthly breakdown
- `GET /api/revenue/distribution/{year}/{month}` - Revenue distribution

### Revenue (User)
- `GET /api/revenue/my-earnings` - User earnings

### Admin
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/payments` - All payments
- `GET /api/admin/users` - All users
- `GET /api/admin/nodes` - All nodes
- `POST /api/admin/wallets/add` - Add admin wallet

---

## Complete Example: Full User Journey

### Scenario: Alice Creates Model, Bob Uses It

**Alice (Model Creator):**

1. **Registration**
   - Connects MetaMask wallet
   - Account created automatically
   - Receives JWT token

2. **Upload Model**
   - Creates group "AI Research Team"
   - Uploads model "GPT-4-Alternative"
   - Model stored in IPFS

3. **Publish Model**
   - First model: FREE ✅
   - Model status: PUBLISHED
   - Appears in marketplace

4. **Create API Service**
   - Creates API service for model
   - Sets price: $10/month subscription
   - Service listed in marketplace

5. **Earn Revenue**
   - 10 users subscribe at $10/month = $100/month
   - Platform takes 30% = $30 → Your wallet
   - Alice gets 70% = $70/month

6. **Monthly Listing Fee**
   - Pays $2/month to keep model listed
   - $2 → Your wallet

**Bob (API Consumer):**

1. **Registration**
   - Registers with email/password
   - Connects TronLink wallet

2. **Subscribe to Platform**
   - Chooses Pro plan: $30/month
   - Pays $30 USDT
   - Platform takes 30% = $9 → Your wallet
   - Subscription activated

3. **Subscribe to Alice's API**
   - Browses marketplace
   - Finds "GPT-4-Alternative"
   - Subscribes for $10/month
   - Platform takes 10% = $1 → Your wallet
   - Alice gets 90% = $9/month
   - Receives API key

4. **Use Chat Application**
   - Opens chat web UI
   - Selects "GPT-4-Alternative"
   - Starts chatting
   - Messages processed by model

5. **Use in Continue.dev**
   - Configures Continue.dev with API key
   - Uses model in VS Code
   - Makes coding requests

**Platform Revenue (Your Wallets):**
```
From Alice's Model:
- Publishing fee: $5 (one-time)
- Listing fees: $2/month
- API subscriptions (10%): $1/month per subscriber

From Bob:
- Platform subscription (30%): $9/month
- API subscription (10%): $1/month

Total from this example:
- One-time: $5
- Monthly: $2 + $9 + $1 = $12/month
```

---

## Key Concepts

### Decentralization

**Storage:**
- Models stored in IPFS (decentralized)
- Also cached in MinIO for fast access
- IPFS ensures permanent, distributed storage

**Compute:**
- Nodes (miners) provide compute power
- No central server for jobs
- Distributed execution

**Payments:**
- All payments in USDT (crypto)
- On-chain verification
- No traditional payment processors

**Authentication:**
- Wallet-based authentication
- No central authority
- User owns their identity

### Revenue Model

**Platform Fees:**
- Sustainable revenue for platform
- Covers infrastructure costs
- Profitable for you as admin

**Creator Earnings:**
- Fair compensation for model creators
- 70-90% of revenue goes to creators
- Encourages quality models

**Node Earnings:**
- Miners earn 90-95% of job payments
- Incentivizes compute providers
- Decentralized infrastructure

### Security

**Wallet Security:**
- Users control their own wallets
- Private keys never stored
- Signature verification

**Payment Security:**
- On-chain transaction verification
- Multiple confirmations required
- Prevents double-spending

**Admin Security:**
- Wallet whitelist only
- No password vulnerabilities
- Signature-based access

---

## Summary

**AIForge Network** is a complete decentralized platform where:

1. **Users** can create, share, and monetize AI models
2. **Miners** provide compute and earn USDT
3. **You (Admin)** receive platform fees and manage the platform
4. **Groups** collaborate and split revenue
5. **Marketplace** enables buying/selling model APIs
6. **Chat Application** provides user-friendly interface

**Revenue flows to you:**
- 30% of subscription revenue
- 5-10% of other transactions
- 100% of publishing/listing fees

**Everything is decentralized:**
- Storage (IPFS)
- Compute (Nodes)
- Payments (Crypto)
- Authentication (Wallets)

The platform is ready for production use! 🚀

