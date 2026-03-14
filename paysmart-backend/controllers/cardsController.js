const Card = require("../models/Card");

/**
 * POST /api/cards
 * Add a new card to MongoDB.
 *
 * Request body: { userId, bankName, cardName, rewardRules }
 */
async function addCard(req, res) {
  try {
    const { userId, bankName, cardName, rewardRules } = req.body;

    if (!userId || !bankName || !cardName) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: userId, bankName, cardName",
      });
    }

    const card = new Card({
      userId,
      bankName,
      cardName,
      rewardRules: rewardRules || [],
    });

    const saved = await card.save();

    return res.status(201).json({
      success: true,
      data: saved,
    });
  } catch (error) {
    console.error("Error adding card:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add card",
    });
  }
}

/**
 * GET /api/cards/:userId
 * Fetch all cards belonging to a specific user.
 */
async function getUserCards(req, res) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameter: userId",
      });
    }

    const cards = await Card.find({ userId });

    return res.status(200).json({
      success: true,
      data: cards,
    });
  } catch (error) {
    console.error("Error fetching user cards:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user cards",
    });
  }
}

/**
 * DELETE /api/cards/:cardId
 * Delete a card by its MongoDB document ID.
 */
async function deleteCard(req, res) {
  try {
    const { cardId } = req.params;

    if (!cardId) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameter: cardId",
      });
    }

    const deleted = await Card.findByIdAndDelete(cardId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Card not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: { cardId, message: "Card deleted successfully" },
    });
  } catch (error) {
    console.error("Error deleting card:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete card",
    });
  }
}

module.exports = { addCard, getUserCards, deleteCard };
