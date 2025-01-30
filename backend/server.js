require("dotenv/config");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const passportConfig = require("./lib/passportConfig");
const bodyParser = require("body-parser");

const app = express();

// 🛡️ Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(passportConfig.initialize());

// 🛠️ Debugging environment variables (masked)
console.log("🔧 Environment Variables:", {
  MONGO_URI: process.env.MONGO_URI
    ? process.env.MONGO_URI.replace(/:[^@]+@/, ":*****@")
    : "Not Found",
  NODE_ENV: process.env.NODE_ENV || "development",
});

// 🚀 MongoDB Connection dengan retry logic
const connectWithRetry = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Waktu tunggu pemilihan server
      socketTimeoutMS: 45000, // Waktu tunggu koneksi socket
      connectTimeoutMS: 10000, // Waktu tunggu koneksi awal
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

// 📡 Event listeners untuk MongoDB
mongoose.connection.on("disconnected", () => {
  console.log("⚠️ MongoDB connection lost!");
});

mongoose.connection.on("reconnected", () => {
  console.log("♻️ MongoDB reconnected!");
});

// ✅ Health check endpoint dengan database ping
app.get("/", async (req, res) => {
  try {
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

// 📌 Routing
app.use("/auth", require("./routes/authRoutes"));
app.use("/api", require("./routes/apiRoutes"));
app.use("/upload", require("./routes/uploadRoutes"));
app.use("/host", require("./routes/downloadRoutes"));

// ⚠️ Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("🔥 Global Error Handler:", err);
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

// 🔥 Export App (for Vercel)
module.exports = app;
