require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

// ── Routes ────────────────────────────────────────────
const authRoutes = require("./routes/auth");
const walletRoutes = require("./routes/wallet");
const activityRoutes = require("./routes/activity");

// ── Connect to MongoDB ────────────────────────────────
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security Middleware ───────────────────────────────
app.use(helmet());
// Allow web origins + any chrome-extension origin
const allowedOrigins = [
    ...(process.env.CLIENT_ORIGIN?.split(",") || ["http://localhost:5173"]),
];

app.use(cors({
    origin: (origin, cb) => {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin) return cb(null, true);
        
        // Allow any chrome-extension:// or moz-extension:// origin
        if (/^(chrome-extension|moz-extension):\/\//.test(origin)) return cb(null, true);

        // Allow configured origins
        if (allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error("CORS: origin not allowed — " + origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

// Ensure preflight OPTIONS is handled for all routes
app.options("*", cors());

// ── Rate Limiting ─────────────────────────────────────
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,             // max 100 requests per window per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests, please try again later." },
});
app.use("/api", limiter);

// ── Stricter limit on auth endpoints ─────────────────
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, message: "Too many auth attempts." },
});
app.use("/api/auth", authLimiter);

// ── Body Parser ───────────────────────────────────────
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: false }));

// ── Logger (dev only) ─────────────────────────────────
if (process.env.NODE_ENV !== "production") {
    app.use(morgan("dev"));
}

// ── Health Check ──────────────────────────────────────
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        service: "My Own Wallet API",
        timestamp: new Date().toISOString(),
    });
});

// ── API Routes ────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/activity", activityRoutes);

// ── 404 Handler ───────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route not found" });
});

// ── Global Error Handler ──────────────────────────────
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === "production"
            ? "Internal server error"
            : err.message,
    });
});

// ── Start Server ──────────────────────────────────────
app.listen(PORT, () => {
    console.log("My Own Wallet API running on port " + PORT);
    console.log("MongoDB URI: " + (process.env.MONGODB_URI ? "connected" : "NOT SET"));
});