const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ deviceId: decoded.deviceId }).select("-activities");
        if (!user) return res.status(401).json({ success: false, message: "User not found" });
        req.user = user;
        req.deviceId = decoded.deviceId;
        next();
    } catch {
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
};

const generateToken = (deviceId) =>
    jwt.sign({ deviceId }, process.env.JWT_SECRET, { expiresIn: "30d" });

module.exports = { protect, generateToken };