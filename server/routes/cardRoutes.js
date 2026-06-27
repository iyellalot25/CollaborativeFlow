// Card routes are split into two groups:
//   1. Cards created under a board: POST /api/boards/:boardId/cards
//   2. Card-level operations by ID: PATCH/DELETE /api/cards/:cardId

const express = require("express");
const router = express.Router();

const {
  createCard,
  updateCard,
  deleteCard,
  moveCard,
} = require("../controllers/cardController");

// CARD ROUTES

// PATCH  /api/cards/:cardId        update card fields
// DELETE /api/cards/:cardId        delete a card
router.route("/:cardId").patch(updateCard).delete(deleteCard);

// PATCH  /api/cards/:cardId/move   move card to another column
router.patch("/:cardId/move", moveCard);

module.exports = router;
