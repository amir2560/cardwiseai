const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:8080',        // ← Lovable dev port
    'https://paysmart.vercel.app'   // ← production later
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────
const cardsRoutes = require('./routes/cards');
const recommendRoutes = require('./routes/recommend');

app.use('/api/cards', cardsRoutes);
app.use('/api/recommend', recommendRoutes);

// ─── Health Check ────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'CardWise Reward Recommendation API is running 🚀',
  });
});

// ─── Start Server ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
