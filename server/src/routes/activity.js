const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validate");

router.use(protect);

/**
 * GET /api/activity?limit=50&skip=0
 * Get paginated activity history from MongoDB.
 */
router.get("/", async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const skip = parseInt(req.query.skip) || 0;

        const user = await User.findOne(
            { deviceId: req.deviceId },
            { activities: { $slice: [skip, limit] } }
        );

        if (!user) return res.json({ success: true, data: [], total: 0 });

        res.json({
            success: true,
            data: user.activities,
            total: user.activities.length,
            hasMore: user.activities.length === limit,
        });
    } catch (err) {
        console.error("Get activity error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

/**
 * POST /api/activity
 * Log a new wallet activity (send/receive/swap/buy).
 */
router.post("/", validate(schemas.addActivity), async (req, res) => {
    try {
        const user = await User.findOne({ deviceId: req.deviceId });
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        user.addActivity(req.body);
        user.lastSyncedAt = new Date();
        await user.save();

        res.status(201).json({
            success: true,
            message: "Activity logged",
            activity: user.activities[0],
        });
    } catch (err) {
        console.error("Add activity error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

/**
 * PATCH /api/activity/:txHash/status
 * Update a transaction status (pending → confirmed/failed).
 */
router.patch("/:txHash/status", async (req, res) => {
    try {
        const { txHash } = req.params;
        const { status } = req.body;

        if (!["pending", "confirmed", "failed"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        await User.updateOne(
            { deviceId: req.deviceId, "activities.txHash": txHash },
            { $set: { "activities.$.status": status } }
        );

        res.json({ success: true, message: "Activity status updated" });
    } catch (err) {
        console.error("Update activity error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

/**
 * DELETE /api/activity
 * Clear entire activity history.
 */
router.delete("/", async (req, res) => {
    try {
        await User.findOneAndUpdate(
            { deviceId: req.deviceId },
            { $set: { activities: [] } }
        );
        res.json({ success: true, message: "Activity history cleared" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;