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
const corsOptions = {
  origin: "http://localhost:3000", // Sesuaikan dengan URL frontend Anda
  methods: ["GET", "POST", "PUT", "DELETE"], // Sesuaikan dengan metode yang digunakan
  allowedHeaders: ["Content-Type", "Authorization"], // Menambahkan header Authorization untuk mengirimkan token
};

app.use(cors(corsOptions));
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
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    console.log("✅ Connected to MongoDB Atlas");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    console.log("🔄 Retrying connection in 5 seconds...");
    setTimeout(connectWithRetry, 5000);
  }
};

connectWithRetry();

// Event Listener untuk koneksi MongoDB
mongoose.connection.on("connected", () => {
  console.log("🎉 MongoDB is connected!");
});

mongoose.connection.on("disconnected", () => {
  console.log("⚠️ MongoDB connection lost!");
});

mongoose.connection.on("reconnected", () => {
  console.log("♻️ MongoDB reconnected!");
});


// ✅ Health check endpoint dengan database ping
app.get("/", async (req, res) => {
  try {
    // Pastikan koneksi MongoDB dalam status "connected" (1)
    if (mongoose.connection.readyState !== 1) {
      throw new Error("Database not connected");
    }

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
