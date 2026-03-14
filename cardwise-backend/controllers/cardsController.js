const { db } = require('../config/firebase');
const {
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
} = require('firebase/firestore');

const CARDS_COLLECTION = 'creditCards';

/**
 * POST /api/cards
 * Add a new credit card document to Firestore.
 *
 * Expected body:
 * {
 *   "userId": "user123",
 *   "bankName": "HDFC",
 *   "cardName": "Regalia",
 *   "rewardRules": [
 *     {
 *       "category": "dining",
 *       "rewardType": "cashback",   // "cashback" | "points"
 *       "percentage": 5,
 *       "monthlyCap": 500,
 *       "pointsValue": null
 *     }
 *   ]
 * }
 */
exports.addCard = async (req, res) => {
  try {
    const { userId, bankName, cardName, rewardRules } = req.body;

    // ── Validation ────────────────────────────────────────────
    if (!userId || !bankName || !cardName) {
      return res.status(400).json({
        error: 'userId, bankName, and cardName are required',
      });
    }

    if (!Array.isArray(rewardRules) || rewardRules.length === 0) {
      return res.status(400).json({
        error: 'rewardRules must be a non-empty array',
      });
    }

    // Generate a unique cardId using Firestore's auto-ID
    const newDocRef = doc(collection(db, CARDS_COLLECTION));
    const cardId = newDocRef.id;

    const cardData = {
      cardId,
      userId,
      bankName,
      cardName,
      rewardRules,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(newDocRef, cardData);

    res.status(201).json({
      message: 'Card added successfully',
      card: cardData,
    });
  } catch (error) {
    console.error('Error adding card:', error);
    res.status(500).json({ error: 'Failed to add card' });
  }
};

/**
 * GET /api/cards/:userId
 * Fetch all credit cards belonging to a specific user.
 */
exports.getCardsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const q = query(
      collection(db, CARDS_COLLECTION),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    const cards = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    res.json({ cards });
  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
};

/**
 * PUT /api/cards/:cardId
 * Update an existing credit card by its cardId field.
 *
 * Accepts any subset of: bankName, cardName, rewardRules
 */
exports.updateCard = async (req, res) => {
  try {
    const { cardId } = req.params;
    const updates = req.body;

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Request body cannot be empty' });
    }

    // Find the document by cardId field
    const q = query(
      collection(db, CARDS_COLLECTION),
      where('cardId', '==', cardId)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const cardDoc = snapshot.docs[0];

    // Prevent overwriting immutable fields
    delete updates.cardId;
    delete updates.createdAt;

    updates.updatedAt = new Date().toISOString();

    await updateDoc(cardDoc.ref, updates);

    res.json({
      message: 'Card updated successfully',
      cardId,
      updatedFields: Object.keys(updates),
    });
  } catch (error) {
    console.error('Error updating card:', error);
    res.status(500).json({ error: 'Failed to update card' });
  }
};

/**
 * DELETE /api/cards/:cardId
 * Delete a credit card by its cardId field.
 */
exports.deleteCard = async (req, res) => {
  try {
    const { cardId } = req.params;

    // Find the document by cardId field
    const q = query(
      collection(db, CARDS_COLLECTION),
      where('cardId', '==', cardId)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const cardDoc = snapshot.docs[0];
    await deleteDoc(cardDoc.ref);

    res.json({
      message: 'Card deleted successfully',
      cardId,
    });
  } catch (error) {
    console.error('Error deleting card:', error);
    res.status(500).json({ error: 'Failed to delete card' });
  }
};
