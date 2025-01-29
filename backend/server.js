const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passportConfig = require("./lib/passportConfig");
const cors = require("cors");
const fs = require("fs");
require("dotenv").config(); // Pastikan dotenv ada di paling atas
console.log("🛠️ MONGO_URI:", process.env.MONGO_URI); // Debugging

// MongoDB Connection (Hanya Satu Kali)
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Cek apakah koneksi berhasil
mongoose.connection.on("connected", () => {
  console.log("🔗 MongoDB Connection Established!");
});

mongoose.connection.on("error", (err) => {
  console.error("⚠️ MongoDB Connection Error:", err);
});

// Initialising directories
const directories = ["./public", "./public/resume", "./public/profile"];
directories.forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
});

const app = express();
const port = process.env.PORT || 4444;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());
app.use(passportConfig.initialize());

// Routing
app.use("/auth", require("./routes/authRoutes"));
app.use("/api", require("./routes/apiRoutes"));
app.use("/upload", require("./routes/uploadRoutes"));
app.use("/host", require("./routes/downloadRoutes"));

app.listen(port, () => {
  console.log(`🚀 Server started on port ${port}!`);
});