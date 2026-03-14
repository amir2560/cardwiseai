const CreditCard = require("../models/CreditCard");
const { calculateBestCard } = require("../services/rewardEngine");

/**
 * POST /api/recommend
 * Accepts: { spendCategory, amount }
 * Fetches ALL cards matching primaryUsageCategory, computes best, returns top 5
 */
async function getRecommendation(req, res) {
  try {
    const { spendCategory, amount } = req.body;

    if (!spendCategory || !amount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: spendCategory, amount",
      });
    }

    if (typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a positive number",
      });
    }

    // Fetch matching cards
    // The prompt says: "Fetches ALL cards from MongoDB matching primaryUsageCategory"
    // But since `calculateBestCard` also handles filtering/computation, fetching all might be safer,
    // or we fetch only those filtering by primaryUsageCategory
    const cards = await CreditCard.find({ primaryUsageCategory: spendCategory });

    if (!cards.length) {
      // If no cards for this category, maybe we fetch all cards and let engine handle it?
      // Let's stick to the prompt strictly or return a fallback
      const allCards = await CreditCard.find();
      if (!allCards.length) {
        return res.status(404).json({
          success: false,
          message: "No cards found in the database. Please run the seeder.",
        });
      }
      
      const recommendations = calculateBestCard(allCards, spendCategory, amount);
      return res.status(200).json({ success: true, data: recommendations });
    }

    const recommendations = calculateBestCard(cards, spendCategory, amount);

    return res.status(200).json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error("Error getting recommendation:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get recommendation",
    });
  }
}

/**
 * GET /api/cards/categories
 * Returns the 8 unique spend categories
 */
async function getCategories(req, res) {
  try {
    const categories = ["dining", "fuel", "shopping", "travel", "groceries", "online_spends", "business", "luxury"];
    return res.status(200).json({ success: true, data: categories });
  } catch (error) {
    console.error("Error getting categories:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

/**
 * GET /api/cards/banks
 * Returns 14 unique banks
 */
async function getBanks(req, res) {
  try {
    const banks = await CreditCard.distinct("bankName");
    return res.status(200).json({ success: true, data: banks });
  } catch (error) {
    console.error("Error getting banks:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

/**
 * GET /api/cards/all
 * Returns all 299 cards
 */
async function getAllCards(req, res) {
  try {
    const cards = await CreditCard.find();
    return res.status(200).json({ success: true, data: cards });
  } catch (error) {
    console.error("Error getting all cards:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

/**
 * GET /api/cards/filter?bank=...&category=...
 */
async function filterCards(req, res) {
  try {
    const { bank, category } = req.query;
    const filter = {};
    if (bank) filter.bankName = bank;
    if (category) filter.primaryUsageCategory = category;

    const cards = await CreditCard.find(filter);
    return res.status(200).json({ success: true, data: cards });
  } catch (error) {
    console.error("Error filtering cards:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// GET /api/insights is requested to show distribution, but the prompt says 
// "Step 3 Dashboard: Recharts BarChart showing avg points, PieChart showing distribution"
// We can provide an endpoint for this or compute it in frontend. Let's provide an insights endpoint just in case.
async function getInsights(req, res) {
  try {
    // 1. Avg points accumulation rate per category
    const avgPointsPerCategory = await CreditCard.aggregate([
      { $group: { _id: "$primaryUsageCategory", avgRate: { $avg: "$pointsAccumulationRate" } } }
    ]);

    // 2. Card distribution by reward type
    const distributionByType = await CreditCard.aggregate([
      { $group: { _id: "$rewardType", count: { $sum: 1 } } }
    ]);

    // 3. Summary stats
    const totalCards = await CreditCard.countDocuments();
    const banksCount = (await CreditCard.distinct("bankName")).length;
    
    // Best rates
    const bestCashbackCard = await CreditCard.findOne({ rewardType: "cashback" }).sort({ pointsAccumulationRate: -1 });
    const bestPointsCard = await CreditCard.findOne({ rewardType: { $ne: "cashback" } }).sort({ pointsAccumulationRate: -1 });

    return res.status(200).json({
      success: true,
      data: {
        avgPointsPerCategory,
        distributionByType,
        stats: {
          totalCards,
          banksCount,
          bestCashbackRate: bestCashbackCard ? bestCashbackCard.pointsAccumulationRate : 0,
          bestPointsRate: bestPointsCard ? bestPointsCard.pointsAccumulationRate : 0
        }
      }
    });
  } catch (error) {
    console.error("Error getting insights:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

module.exports = { 
  getRecommendation,
  getCategories,
  getBanks,
  getAllCards,
  filterCards,
  getInsights
};
