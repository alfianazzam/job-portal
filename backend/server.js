const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passportConfig = require("./lib/passportConfig");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// Debugging dengan masking sensitive data
console.log("🔧 Environment Variables:", {
  MONGO_URI: process.env.MONGO_URI
    ? process.env.MONGO_URI.replace(/:[^@]+@/, ":*****@")
    : "Not Found",
});

// MongoDB Connection dengan retry logic
const connectWithRetry = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ Connected to MongoDB Atlas");
    console.log("💡 Database Name:", mongoose.connection.name);
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    console.log("🔄 Retrying connection in 5 seconds...");
    setTimeout(connectWithRetry, 5000);
  }
};

connectWithRetry();

// Event listeners untuk koneksi MongoDB
mongoose.connection.on("disconnected", () => {
  console.log("⚠️ MongoDB connection lost!");
});

mongoose.connection.on("reconnected", () => {
  console.log("♻️ MongoDB reconnected!");
});

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());
app.use(passportConfig.initialize());

// Health check endpoint dengan verifikasi aktif
app.get("/", async (req, res) => {
  try {
    // Test koneksi database dengan ping
    await mongoose.connection.db.admin().ping();

    res.status(200).json({
      success: true,
      message: "🚀 Server is fully operational!",
      database: {
        name: mongoose.connection.name,
        status: "Connected",
        version: await mongoose.connection.db.admin().serverInfo().version,
      },
      environment: process.env.NODE_ENV || "development",
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      message: `❌ Database connection error: ${err.message}`,
      status: "Disconnected",
    });
  }
});

// Routing
app.use("/auth", require("./routes/authRoutes"));
app.use("/api", require("./routes/apiRoutes"));
app.use("/upload", require("./routes/uploadRoutes"));
app.use("/host", require("./routes/downloadRoutes"));

module.exports = app;