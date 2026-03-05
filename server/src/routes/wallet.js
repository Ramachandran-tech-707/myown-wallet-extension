const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validate");

// All wallet routes require authentication
router.use(protect);

/**
 * GET /api/wallet/backup
 * Pull full backup: wallets + settings + account names.
 * Used on fresh install to restore from cloud.
 */
router.get("/backup", async (req, res) => {
    try {
        const user = await User.findOne({ deviceId: req.deviceId });
        if (!user) return res.status(404).json({ success: false, message: "No backup found" });

        res.json({
            success: true,
            data: {
                wallets: user.wallets,
                accountNames: Object.fromEntries(user.accountNames),
                settings: user.settings,
                lastSyncedAt: user.lastSyncedAt,
                backupVersion: user.backupVersion,
            },
        });
    } catch (err) {
        console.error("Backup GET error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

/**
 * POST /api/wallet/sync
 * Push local wallets + account names to MongoDB.
 * Full replace — client is the source of truth.
 */
router.post("/sync", validate(schemas.syncWallets), async (req, res) => {
    try {
        const { wallets, accountNames } = req.body;

        const namesMap = accountNames
            ? new Map(Object.entries(accountNames))
            : undefined;

        const update = {
            wallets,
            lastSyncedAt: new Date(),
            backupVersion: Date.now(),
            ...(wallets[0] && { primaryAddress: wallets[0].address }),
        };
        if (namesMap !== undefined) update.accountNames = namesMap;

        const user = await User.findOneAndUpdate(
            { deviceId: req.deviceId },
            { $set: update },
            { new: true, upsert: true }
        );

        res.json({
            success: true,
            message: "Wallets synced to MongoDB",
            walletCount: user.wallets.length,
            lastSyncedAt: user.lastSyncedAt,
        });
    } catch (err) {
        console.error("Sync error:", err);
        res.status(500).json({ success: false, message: "Sync failed" });
    }
});

/**
 * PATCH /api/wallet/settings
 * Update settings (network, selectedAccount, currency, theme).
 */
router.patch("/settings", validate(schemas.syncSettings), async (req, res) => {
    try {
        const settingsUpdate = {};
        for (const [key, val] of Object.entries(req.body)) {
            settingsUpdate[`settings.${key}`] = val;
        }

        await User.findOneAndUpdate(
            { deviceId: req.deviceId },
            { $set: { ...settingsUpdate, lastSyncedAt: new Date() } }
        );

        res.json({ success: true, message: "Settings updated" });
    } catch (err) {
        console.error("Settings update error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

/**
 * DELETE /api/wallet/:address
 * Remove a single wallet from the backup.
 */
router.delete("/:address", async (req, res) => {
    try {
        const { address } = req.params;
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
            return res.status(400).json({ success: false, message: "Invalid address" });
        }

        await User.findOneAndUpdate(
            { deviceId: req.deviceId },
            {
                $pull: { wallets: { address: new RegExp(`^${address}$`, "i") } },
                $set: { lastSyncedAt: new Date() },
            }
        );

        res.json({ success: true, message: "Wallet removed from backup" });
    } catch (err) {
        console.error("Remove wallet error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

/**
 * DELETE /api/wallet/all
 * Wipe entire backup for this device.
 */
router.delete("/", async (req, res) => {
    try {
        await User.findOneAndDelete({ deviceId: req.deviceId });
        res.json({ success: true, message: "All backup data deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;