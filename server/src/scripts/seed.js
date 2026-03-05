/**
 * seed.js — creates indexes and verifies the MongoDB connection.
 * Run once after first deploy: node src/scripts/seed.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });

const mongoose = require("mongoose");
const User = require("../models/User");

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        // Ensure all indexes are created
        await User.createIndexes();
        console.log("Indexes created successfully");

        const count = await User.countDocuments();
        console.log("Total users in DB:", count);

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("Collections:", collections.map((c) => c.name).join(", "));

        console.log("Seed complete!");
        process.exit(0);
    } catch (err) {
        console.error("Seed failed:", err.message);
        process.exit(1);
    }
};

run();