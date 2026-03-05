const mongoose = require("mongoose");

// ── Wallet Sub-Schema ─────────────────────────────────
// IMPORTANT: encryptedJson is already AES-encrypted by ethers.js on the client.
// We never store raw private keys — only the client-side encrypted blob.
const walletSchema = new mongoose.Schema({
    address: { type: String, required: true },
    encryptedJson: { type: String, required: true }, // ethers.js encrypted keystore
    name: { type: String, default: "" },
    isImported: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

// ── Activity Log Sub-Schema ───────────────────────────
const activitySchema = new mongoose.Schema({
    type: { type: String, enum: ["send", "receive", "swap", "buy"], required: true },
    txHash: { type: String },
    amount: { type: String },
    token: { type: String },
    network: { type: String },
    from: { type: String },
    to: { type: String },
    status: { type: String, enum: ["pending", "confirmed", "failed"], default: "pending" },
    timestamp: { type: Date, default: Date.now },
});

// ── Settings Sub-Schema ───────────────────────────────
const settingsSchema = new mongoose.Schema({
    selectedNetwork: { type: String, default: "ethereum" },
    selectedAccount: { type: Number, default: 0 },
    currency: { type: String, default: "USD" },
    theme: { type: String, default: "dark" },
}, { _id: false });

// ── Main User Schema ──────────────────────────────────
const userSchema = new mongoose.Schema(
    {
        // Unique device/browser fingerprint — no email needed
        deviceId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        // Primary wallet address (first/main wallet)
        primaryAddress: {
            type: String,
            index: true,
        },

        // All wallets belonging to this device
        wallets: {
            type: [walletSchema],
            default: [],
        },

        // Account display names: { address: name }
        accountNames: {
            type: Map,
            of: String,
            default: {},
        },

        // App settings
        settings: {
            type: settingsSchema,
            default: () => ({}),
        },

        // Transaction/activity history
        activities: {
            type: [activitySchema],
            default: [],
        },

        // Backup metadata
        lastSyncedAt: { type: Date, default: Date.now },
        backupVersion: { type: Number, default: 1 },
    },
    {
        timestamps: true, // adds createdAt, updatedAt automatically
    }
);

// ── Indexes ───────────────────────────────────────────
userSchema.index({ "wallets.address": 1 });
userSchema.index({ lastSyncedAt: -1 });

// ── Instance Methods ──────────────────────────────────
userSchema.methods.addWallet = function (walletData) {
    const exists = this.wallets.some(
        (w) => w.address.toLowerCase() === walletData.address.toLowerCase()
    );
    if (!exists) {
        this.wallets.push(walletData);
        if (!this.primaryAddress) this.primaryAddress = walletData.address;
    }
    return this;
};

userSchema.methods.removeWallet = function (address) {
    this.wallets = this.wallets.filter(
        (w) => w.address.toLowerCase() !== address.toLowerCase()
    );
    if (this.primaryAddress?.toLowerCase() === address.toLowerCase()) {
        this.primaryAddress = this.wallets[0]?.address || null;
    }
    return this;
};

userSchema.methods.addActivity = function (activityData) {
    this.activities.unshift(activityData); // newest first
    // Keep only last 200 activities to prevent unbounded growth
    if (this.activities.length > 200) {
        this.activities = this.activities.slice(0, 200);
    }
    return this;
};

module.exports = mongoose.model("User", userSchema);