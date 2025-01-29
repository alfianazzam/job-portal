const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passportConfig = require("./lib/passportConfig");
const cors = require("cors");
const fs = require("fs");
require("dotenv").config();

// Debugging
// Tambahkan di awal kode untuk debug
console.log('🔍 Current MONGO_URI:', process.env.MONGO_URI?.replace(/:[^@]+@/, ':*****@'));

// MongoDB Connection
const connectWithRetry = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    console.log('✅ Connected to MongoDB Atlas');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err);
    setTimeout(connectWithRetry, 5000);
  }
};

connectWithRetry();

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());
app.use(passportConfig.initialize());

// Added connection check endpoint
app.get("/", async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    res.status(200).json({
      success: true,
      message: "🚀 Connected to MongoDB Atlas!",
      version: await mongoose.connection.db.admin().serverInfo(),
      status: "Connected"
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      message: `❌ Database Connection Error: ${err.message}`,
      status: "Disconnected"
    });
  }
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected!');
});

mongoose.connection.on('reconnected', () => {
  console.log('♻️ MongoDB reconnected!');
});

// Routing
app.use("/auth", require("./routes/authRoutes"));
app.use("/api", require("./routes/apiRoutes"));
app.use("/upload", require("./routes/uploadRoutes"));
app.use("/host", require("./routes/downloadRoutes"));

// Vercel handler export
module.exports = app;