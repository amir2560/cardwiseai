const { db } = require('../config/firebase');
const { collection, getDocs, query, where } = require('firebase/firestore');
const { rankCards, calculateBestCard } = require('../services/rewardEngine');

const CARDS_COLLECTION = 'creditCards';

/**
 * POST /api/recommend
 * Accept user spending categories and return ranked card recommendations.
 *
 * Expected body:
 * {
 *   "spending": {
 *     "dining": 500,
 *     "groceries": 300,
 *     "travel": 200,
 *     "gas": 150,
 *     "online": 400
 *   }
 * }
 */
exports.getRecommendations = async (req, res) => {
  try {
    const { spending } = req.body;

    if (!spending || typeof spending !== 'object') {
      return res.status(400).json({
        error: 'spending object is required, e.g. { "dining": 500, "groceries": 300 }',
      });
    }

    // Fetch all available cards from Firestore
    const snapshot = await getDocs(collection(db, CARDS_COLLECTION));
    const cards = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Rank cards using the reward engine
    const recommendations = rankCards(cards, spending);

    res.json({ recommendations });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
};

// ═══════════════════════════════════════════════════════════════
//  POST /api/recommend/best
//  Find the best card for a single purchase.
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/recommend/best
 * Accept a userId, purchase category, and amount — then return
 * the user's cards ranked by reward benefit for that purchase.
 *
 * Expected body:
 * {
 *   "userId"   : "user123",
 *   "category" : "dining",
 *   "amount"   : 2000
 * }
 *
 * Response:
 * {
 *   "userId"  : "user123",
 *   "category": "dining",
 *   "amount"  : 2000,
 *   "results" : [ …sorted best-card objects… ]
 * }
 */
exports.getBestCard = async (req, res) => {
  try {
    const { userId, category, amount } = req.body;

    // ── Input validation ──────────────────────────────────────

    // 1. userId must be a non-empty string
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({
        error: 'userId (string) is required.',
      });
    }

    // 2. category must be a non-empty string
    if (!category || typeof category !== 'string') {
      return res.status(400).json({
        error: 'category (string) is required, e.g. "dining", "fuel", "groceries".',
      });
    }

    // 3. amount must be a positive number
    if (amount === undefined || amount === null || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        error: 'amount must be a positive number (₹).',
      });
    }

    // ── Fetch only this user's cards from Firestore ───────────
    const q = query(
      collection(db, CARDS_COLLECTION),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    const cards = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    // If the user has no saved cards, return early with a
    // helpful message instead of an empty array.
    if (cards.length === 0) {
      return res.status(404).json({
        error: `No cards found for userId "${userId}". Add cards first via POST /api/cards.`,
      });
    }

    // ── Run the reward engine ─────────────────────────────────
    const results = calculateBestCard(cards, category, amount);

    // ── Return the ranked results along with the input echo ───
    res.json({
      userId,
      category,
      amount,
      results,
    });
  } catch (error) {
    console.error('Error finding best card:', error);
    res.status(500).json({ error: 'Failed to find the best card' });
  }
};
