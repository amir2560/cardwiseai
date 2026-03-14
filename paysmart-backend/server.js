const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// ─── MongoDB Connection ─────────────────────────────────────────────────────
const connectDB = require("./config/db");
connectDB();

// ─── Express App Setup ──────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:8080",
    methods: ["GET", "POST", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());

// ─── Import Controllers ─────────────────────────────────────────────────────
const {
  getRecommendation,
  getCategories,
  getBanks,
  getAllCards,
  filterCards,
  getInsights
} = require("./controllers/recommendController");

// ─── Health Check ────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "PaySmart backend running" });
});

// ─── Cards API Routes ────────────────────────────────────────────────────────
app.get("/api/cards/categories", getCategories);
app.get("/api/cards/banks", getBanks);
app.get("/api/cards/all", getAllCards);
app.get("/api/cards/filter", filterCards);
app.post("/api/recommend", getRecommendation);
app.get("/api/insights", getInsights);

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

// ─── Start Server ────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ PaySmart backend running on http://localhost:${PORT}`);
});

module.exports = { app };
