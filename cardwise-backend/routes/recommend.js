const express = require('express');
const router = express.Router();
const recommendController = require('../controllers/recommendController');

// POST /api/recommend        → get card recommendations based on spending
router.post('/', recommendController.getRecommendations);

// POST /api/recommend/best   → find the best card for a single purchase
router.post('/best', recommendController.getBestCard);

module.exports = router;

