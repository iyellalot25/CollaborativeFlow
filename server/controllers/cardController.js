// Handles all card-level operations.

const Card = require("../models/Card");
const Column = require("../models/Column");
const Board = require("../models/Board");

/**
 * POST /api/boards/:boardId/cards
 * Creates a new card inside a specific column.
 * Body: { title, columnId, description?, priority?, assignee?, labels? }
 *
 * The card is appended to the bottom of the target column.
 */
const createCard = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { title, columnId, description, priority, assignee, labels } =
      req.body;

    // Validate required fields
    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Card title is required",
      });
    }

    if (!columnId) {
      return res.status(400).json({
        success: false,
        message: "columnId is required",
      });
    }

    // Verify the column exists AND belongs to this board.
    // This prevents someone from creating a card in a column
    // that belongs to a different board.
    const column = await Column.findOne({ _id: columnId, boardId });
    if (!column) {
      return res.status(404).json({
        success: false,
        message: "Column not found on this board",
      });
    }

    // Count cards already in this column to set order for the new card.
    // New card always goes to the bottom of the column.
    const cardCount = await Card.countDocuments({ columnId });

    const card = await Card.create({
      boardId,
      columnId,
      title: title.trim(),
      description: description ? description.trim() : "",
      priority: priority || "medium",
      assignee: assignee ? assignee.trim() : "",
      labels: Array.isArray(labels) ? labels : [],
      order: cardCount, // append to bottom of column
    });

    res.status(201).json({
      success: true,
      data: card,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }
    console.error("createCard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create card",
    });
  }
};

/**
 * PATCH /api/cards/:cardId
 * Updates a card's fields (title, description, priority, assignee, labels).
 * Does NOT handle moving a card between columns
 * Body: any subset of { title, description, priority, assignee, labels }
 */
const updateCard = async (req, res) => {
  try {
    const { cardId } = req.params;

    // Whitelist: only allow updating these specific fields.
    const allowedFields = [
      "title",
      "description",
      "priority",
      "assignee",
      "labels",
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Trim string fields
    if (updates.title) updates.title = updates.title.trim();
    if (updates.description) updates.description = updates.description.trim();
    if (updates.assignee) updates.assignee = updates.assignee.trim();

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update",
      });
    }

    // findByIdAndUpdate options:
    // new: true  => return the updated document (not the old one)
    // runValidators: true => run schema validators on the update
    const card = await Card.findByIdAndUpdate(
      cardId,
      { $set: updates },
      { new: true, runValidators: true },
    );

    if (!card) {
      return res.status(404).json({
        success: false,
        message: "Card not found",
      });
    }

    res.status(200).json({
      success: true,
      data: card,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid card ID format",
      });
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }
    console.error("updateCard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update card",
    });
  }
};

/**
 * DELETE /api/cards/:cardId
 * Deletes a single card.
 */
const deleteCard = async (req, res) => {
  try {
    const { cardId } = req.params;

    const card = await Card.findByIdAndDelete(cardId);

    if (!card) {
      return res.status(404).json({
        success: false,
        message: "Card not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Card deleted",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid card ID format",
      });
    }
    console.error("deleteCard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete card",
    });
  }
};

/**
 * PATCH /api/cards/:cardId/move
 * Moves a card to a different column (or repositions it within the same column).
 * Body: { targetColumnId: string, newOrder: number }
 */
const moveCard = async (req, res) => {
  try {
    const { cardId } = req.params;
    const { targetColumnId, newOrder } = req.body;

    if (!targetColumnId) {
      return res.status(400).json({
        success: false,
        message: "targetColumnId is required",
      });
    }

    if (newOrder === undefined || newOrder === null) {
      return res.status(400).json({
        success: false,
        message: "newOrder is required",
      });
    }

    // Verify the card exists
    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({
        success: false,
        message: "Card not found",
      });
    }

    // Verify the target column exists and belongs to the same board
    const targetColumn = await Column.findOne({
      _id: targetColumnId,
      boardId: card.boardId,
    });
    if (!targetColumn) {
      return res.status(404).json({
        success: false,
        message: "Target column not found on this board",
      });
    }

    // Update the card's column and order
    card.columnId = targetColumnId;
    card.order = newOrder;
    await card.save();

    // Re-fetch all cards in the destination column and normalize their order.
    const allCardsInTargetColumn = await Card.find({
      columnId: targetColumnId,
    }).sort({ order: 1 });

    // Rebuild order as 0, 1, 2, 3... (clean consecutive integers)
    const bulkOps = allCardsInTargetColumn.map((c, index) => ({
      updateOne: {
        filter: { _id: c._id },
        update: { $set: { order: index } },
      },
    }));

    if (bulkOps.length > 0) {
      await Card.bulkWrite(bulkOps);
    }

    // Return the updated card with its final normalized order
    const updatedCard = await Card.findById(cardId);

    res.status(200).json({
      success: true,
      data: updatedCard,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }
    console.error("moveCard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to move card",
    });
  }
};

module.exports = {
  createCard,
  updateCard,
  deleteCard,
  moveCard,
};
