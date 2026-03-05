# My Own Wallet — Chrome Extension + Web3 Wallet

A MetaMask-style crypto wallet built with React + Vite + Ethers.js,
with MongoDB cloud backup via an Express API server.

---

## Complete Folder Structure

```
metamask_clone_new/               ← your existing extension folder
│
├── .env                          ← frontend environment variables
├── .gitignore
├── eslint.config.js
├── index.html                    ← popup entry point
├── manifest.json                 ← Chrome extension manifest
├── background.js                 ← extension service worker
├── package.json                  ← frontend dependencies (React 19, Vite 7)
├── vite.config.js
│
├── public/                       ← static files copied to dist/ on build
│   ├── own_icon.png              ← YOUR icon (copy here from assets)
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
│
├── src/                          ← React frontend source
│   ├── main.jsx                  ← React root mount
│   ├── App.jsx                   ← Router / state manager
│   ├── index.css                 ← All styles (1600+ lines)
│   │
│   ├── components/               ← Reusable UI components
│   │   ├── Layout.jsx            ← App shell + top bar + bottom nav
│   │   ├── BottomNav.jsx         ← Home / Swap / Buy / Accounts tabs
│   │   ├── AccountPanel.jsx      ← Slide-up accounts drawer
│   │   ├── PasswordInput.jsx     ← Password field with eye toggle
│   │   ├── AccountSelector.jsx
│   │   └── NetworkSelector.jsx
│   │
│   ├── pages/                    ← One file per screen
│   │   ├── Onboarding.jsx        ← Create new wallet
│   │   ├── Unlock.jsx            ← Password unlock
│   │   ├── Dashboard.jsx         ← Balance + Tokens/NFTs/Activity tabs
│   │   ├── Send.jsx              ← Send crypto
│   │   ├── Confirm.jsx           ← Transaction confirmation
│   │   ├── Receive.jsx           ← QR code receive
│   │   ├── Swap.jsx              ← Token swap
│   │   ├── Buy.jsx               ← Fiat on-ramp
│   │   ├── ImportAccount.jsx     ← Import via private key
│   │   └── AccountDetails.jsx    ← Name / QR / Private key / Remove
│   │
│   ├── services/                 ← Business logic & API calls
│   │   ├── walletService.js      ← Create / decrypt / import / export wallet
│   │   ├── storageService.js     ← Dual-layer: local + MongoDB sync
│   │   ├── networkService.js     ← Ethers.js provider factory
│   │   ├── transactionService.js ← Gas estimation + send tx
│   │   ├── apiService.js         ← All calls to Express backend
│   │   └── [unused legacy files kept for compatibility]
│   │
│   ├── config/
│   │   └── networks.js           ← ETH / BNB / Polygon config
│   │
│   └── utils/
│       └── storage.js            ← localStorage vs chrome.storage adapter
│
└── server/                       ← Express + MongoDB backend
    ├── .env                      ← server environment variables
    ├── .env.example              ← template
    ├── package.json              ← server dependencies
    ├── README.md                 ← API docs
    │
    └── src/
        ├── index.js              ← Express app entry point (port 5000)
        │
        ├── config/
        │   └── db.js             ← Mongoose connection
        │
        ├── models/
        │   └── User.js           ← MongoDB schema (wallets, settings, activity)
        │
        ├── middleware/
        │   ├── auth.js           ← JWT verify + generate
        │   └── validate.js       ← Joi request validation
        │
        ├── routes/
        │   ├── auth.js           ← POST /api/auth/register, GET /api/auth/me
        │   ├── wallet.js         ← GET/POST /api/wallet/backup|sync|settings
        │   └── activity.js       ← GET/POST/PATCH/DELETE /api/activity
        │
        └── scripts/
            └── seed.js           ← Run once to create DB indexes
```

---

## Setup — Step by Step

### 1. Frontend (extension)

```bash
# Inside metamask_clone_new/
npm install
npm run dev          # dev server at http://localhost:5173
npm run build        # production build → dist/
```

### 2. Backend (MongoDB API)

```bash
# Inside metamask_clone_new/server/
npm install

# Copy .env.example to .env and edit
cp .env.example .env

# Run once to create indexes
npm run seed

# Start server (port 5000)
npm run dev
```

### 3. MongoDB options

**Local:**
```
MONGODB_URI=mongodb://localhost:27017/my_own_wallet
```
Start local MongoDB: `mongod --dbpath /data/db`

**Atlas (cloud, free tier):**
1. Go to https://cloud.mongodb.com → create free cluster
2. Database Access → add user with password
3. Network Access → allow your IP (or 0.0.0.0/0 for all)
4. Connect → Drivers → copy connection string
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/my_own_wallet
```

### 4. Load extension in Chrome

```bash
npm run build
```
Then:
1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `dist/` folder

---

## Environment Variables

### Frontend — `.env`
```
VITE_ETH_RPC=https://rpc.ankr.com/eth
VITE_BSC_RPC=https://rpc.ankr.com/bsc
VITE_POLYGON_RPC=https://rpc.ankr.com/polygon
VITE_INFURE_API_KEY=your_infura_key
VITE_API_URL=http://localhost:5000/api
```

### Backend — `server/.env`
```
MONGODB_URI=mongodb://localhost:27017/my_own_wallet
JWT_SECRET=your_long_random_secret_here
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
```

---

## How Storage Works

```
User action (create wallet / change network / send tx)
        │
        ▼
  localStorage (web)              ← instant, works offline
  chrome.storage.local (extension) ← instant, persists in extension
        │
        │ 2 second debounce (background, never blocks UI)
        ▼
  MongoDB via Express API          ← cloud backup, cross-device restore
```

On first install with empty local storage → automatically restores
from MongoDB backup if one exists for this device.

---

## Security
- Private keys are NEVER sent to the server
- Only ethers.js AES-encrypted JSON (keystore) is stored
- Device auth via JWT (no email/password needed)
- Rate limited: 100 req/15min, 20 req/15min on auth