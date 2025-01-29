const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passportConfig = require("./lib/passportConfig");
const cors = require("cors");
const fs = require("fs");
require("dotenv").config();

// Debugging
console.log("🛠️ MONGO_URI:", process.env.MONGO_URI);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ Connected to MongoDB Atlas");
    console.log("✨ You are Connected");
  })
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());
app.use(passportConfig.initialize());

// Added connection check endpoint
app.get("/", (req, res) => {
  if (mongoose.connection.readyState === 1) {
    res.status(200).json({
      success: true,
      message: "🚀 You are Connected to MongoDB Atlas!",
      database: mongoose.connection.name,
      status: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"
    });
  } else {
    res.status(503).json({
      success: false,
      message: "❌ Database Connection Lost",
      status: "Disconnected"
    });
  }
});

// Routing
app.use("/auth", require("./routes/authRoutes"));
app.use("/api", require("./routes/apiRoutes"));
app.use("/upload", require("./routes/uploadRoutes"));
app.use("/host", require("./routes/downloadRoutes"));

// Vercel handler export
module.exports = app;