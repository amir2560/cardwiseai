const express = require('express');
const router = express.Router();
const cardsController = require('../controllers/cardsController');

// POST   /api/cards            → add a new credit card
router.post('/', cardsController.addCard);

// GET    /api/cards/:userId    → get all cards for a user
router.get('/:userId', cardsController.getCardsByUser);

// PUT    /api/cards/:cardId    → update a card by cardId
router.put('/:cardId', cardsController.updateCard);

// DELETE /api/cards/:cardId    → delete a card by cardId
router.delete('/:cardId', cardsController.deleteCard);

module.exports = router;
