
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const categoryRoutes = require("./routes/categories");
const locationRoutes = require("./routes/locations");
const assetRoutes = require("./routes/assets");
const borrowingRoutes = require("./routes/borrowings");
const reportRoutes = require("./routes/reports");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/borrowings", borrowingRoutes);
app.use("/api/reports", reportRoutes);

// Route utama
app.get("/", (req, res) => {
  res.json({
    pesan: "API Management Aset Sekolah aktif",
    data: null,
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    pesan: "Server berjalan dengan baik",
    data: {
      status: "OK",
    },
  });
});

// Jalankan server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server berjalan pada port ${PORT}`);
});
