# My Own Wallet — Backend API

MongoDB backup and sync server for My Own Wallet.

## Stack

- Node.js + Express
- MongoDB + Mongoose
- JWT authentication (device-based, no email required)
- Helmet + CORS + Rate limiting

## Quick Start

### 1. Install dependencies

```bash
cd server
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

### 3. Start MongoDB

```bash
# Local MongoDB
mongod --dbpath /data/db

# OR use MongoDB Atlas (cloud) — just paste the connection string in .env
```

### 4. Run seed script (first time only)

```bash
npm run seed
```

### 5. Start server

```bash
npm run dev     # development (nodemon)
npm start       # production
```

## API Endpoints

### Auth

| Method | Endpoint           | Description                  |
| ------ | ------------------ | ---------------------------- |
| POST   | /api/auth/register | Register or re-auth a device |
| GET    | /api/auth/me       | Get current device info      |

### Wallet Backup

| Method | Endpoint             | Description                   |
| ------ | -------------------- | ----------------------------- |
| GET    | /api/wallet/backup   | Pull full backup from MongoDB |
| POST   | /api/wallet/sync     | Push wallets to MongoDB       |
| PATCH  | /api/wallet/settings | Update settings in MongoDB    |
| DELETE | /api/wallet/:address | Remove one wallet from backup |
| DELETE | /api/wallet          | Wipe all backup data          |

### Activity Log

| Method | Endpoint                     | Description            |
| ------ | ---------------------------- | ---------------------- |
| GET    | /api/activity                | Get paginated activity |
| POST   | /api/activity                | Log new activity       |
| PATCH  | /api/activity/:txHash/status | Update tx status       |
| DELETE | /api/activity                | Clear activity history |

## MongoDB Collections

### users

```
{
  deviceId:       String (unique)       — browser/device fingerprint
  primaryAddress: String                — main wallet address
  wallets: [{
    address:        String              — wallet address
    encryptedJson:  String              — ethers.js AES-encrypted keystore
    name:           String              — display name
    isImported:     Boolean
  }]
  accountNames:   Map<address, name>   — display names map
  settings: {
    selectedNetwork:  String
    selectedAccount:  Number
    currency:         String
    theme:            String
  }
  activities: [{
    type:      send|receive|swap|buy
    txHash:    String
    amount:    String
    token:     String
    network:   String
    from:      String
    to:        String
    status:    pending|confirmed|failed
    timestamp: Date
  }]
  lastSyncedAt:   Date
  backupVersion:  Number
  createdAt:      Date
  updatedAt:      Date
}
```

## Security Notes

- Private keys are NEVER stored — only ethers.js client-side encrypted JSON
- Device auth uses JWT (30 day expiry), no email/password required
- Rate limited: 100 req/15min global, 20 req/15min on auth endpoints
- CORS restricted to CLIENT_ORIGIN from .env
