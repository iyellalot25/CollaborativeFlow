// Maps HTTP method + URL path => controller function.
// This file contains NO logic => only routing declarations.

const express = require("express");
const router = express.Router();

// Import all board and column controller functions
const {
  getAllBoards,
  createBoard,
  getBoardById,
  deleteBoard,
  createColumn,
  reorderColumns,
} = require("../controllers/boardController");

// BOARD ROUTES

// GET  /api/boards         list all boards
// POST /api/boards         create a new board
router.route("/").get(getAllBoards).post(createBoard);

// GET    /api/boards/:boardId   get one board with columns + cards
// DELETE /api/boards/:boardId   delete board + cascade
router.route("/:boardId").get(getBoardById).delete(deleteBoard);

// COLUMN ROUTES (nested under boards)

// POST  /api/boards/:boardId/columns           create a column
router.post("/:boardId/columns", createColumn);

// PATCH /api/boards/:boardId/columns/reorder   reorder all columns
router.patch("/:boardId/columns/reorder", reorderColumns);

module.exports = router;
