const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect, generateToken } = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validate");

/**
 * POST /api/auth/register
 * Body: { deviceId: string }
 */
router.post("/register", validate(schemas.register), async (req, res) => {
    try {
        const { deviceId } = req.body;

        let user = await User.findOne({ deviceId });
        let isNew = false;

        if (!user) {
            user = await User.create({ deviceId, lastSyncedAt: new Date() });
            isNew = true;
        }

        const token = generateToken(deviceId);

        res.status(isNew ? 201 : 200).json({
            success: true,
            isNew,
            token,
            user: {
                deviceId: user.deviceId,
                primaryAddress: user.primaryAddress,
                walletCount: user.wallets.length,
                settings: user.settings,
                lastSyncedAt: user.lastSyncedAt,
            },
        });
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

/**
 * GET /api/auth/me
 */
router.get("/me", protect, async (req, res) => {
    const u = req.user;
    res.json({
        success: true,
        user: {
            deviceId: u.deviceId,
            primaryAddress: u.primaryAddress,
            walletCount: u.wallets.length,
            walletAddresses: u.wallets.map((w) => ({
                address: w.address,
                name: w.name,
                isImported: w.isImported,
            })),
            settings: u.settings,
            accountNames: Object.fromEntries(u.accountNames || new Map()),
            lastSyncedAt: u.lastSyncedAt,
            createdAt: u.createdAt,
        },
    });
});

module.exports = router;