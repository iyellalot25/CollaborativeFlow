// Handles all board-level and column-level operations.
// Each exported function maps to one API endpoint.

const Board = require("../models/Board");
const Column = require("../models/Column");
const Card = require("../models/Card");

// BOARDS

/**
 * GET /api/boards
 * Returns all boards, newest first.
 * Used on the BoardsPage to display the list of projects.
 */
const getAllBoards = async (req, res) => {
  try {
    const boards = await Board.find({})
      .sort({ createdAt: -1 })
      .select("name description createdAt");

    res.status(200).json({
      success: true,
      count: boards.length, // helpful for the frontend to know total count
      data: boards,
    });
  } catch (error) {
    console.error("getAllBoards error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch boards",
    });
  }
};

/**
 * POST /api/boards
 * Creates a new board.
 * Body: { name: string, description?: string }
 */
const createBoard = async (req, res) => {
  try {
    // Destructure the fields we expect from the request body.
    // We never trust the client to send exactly what we need —
    // we pick only the fields we want and ignore the rest.
    const { name, description } = req.body;

    // Manual validation: Mongoose will also validate, but checking
    // early gives us a clean 400 response before hitting the DB.
    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Board name is required",
      });
    }

    // Create the board document.
    const board = await Board.create({
      name: name.trim(),
      description: description ? description.trim() : "",
    });

    res.status(201).json({
      success: true,
      data: board,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }
    console.error("createBoard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create board",
    });
  }
};

/**
 * GET /api/boards/:boardId
 * Returns a single board with ALL its columns and cards.
 * This is the main data fetch for the BoardPage.
 *
 * Response shape:
 * {
 *   board: { _id, name, description },
 *   columns: [ { _id, title, order, cards: [...] } ]
 * }
 */
const getBoardById = async (req, res) => {
  try {
    const { boardId } = req.params;

    // Find the board firs if it doesn't exist return 404
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    // Fetch all columns for this board, sorted left to right
    const columns = await Column.find({ boardId }).sort({ order: 1 });

    // Fetch all cards for this board
    const cards = await Card.find({ boardId }).sort({ order: 1 });

    // Group cards by their columnId.
    const cardsByColumn = {};
    cards.forEach((card) => {
      const key = card.columnId.toString(); // ObjectId => string for use as key
      if (!cardsByColumn[key]) {
        cardsByColumn[key] = [];
      }
      cardsByColumn[key].push(card);
    });

    // Attach the relevant cards array to each column object.
    const columnsWithCards = columns.map((column) => ({
      ...column.toObject(),
      cards: cardsByColumn[column._id.toString()] || [],
    }));

    res.status(200).json({
      success: true,
      data: {
        board,
        columns: columnsWithCards,
      },
    });
  } catch (error) {
    // CastError happens when boardId is not a valid ObjectId format
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid board ID format",
      });
    }
    console.error("getBoardById error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch board",
    });
  }
};

/**
 * DELETE /api/boards/:boardId
 * Deletes a board AND all its columns and cards (cascade delete).
 */
const deleteBoard = async (req, res) => {
  try {
    const { boardId } = req.params;

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    // Delete in order: cards first, then columns, then the board.
    await Card.deleteMany({ boardId });
    await Column.deleteMany({ boardId });
    await Board.findByIdAndDelete(boardId);

    res.status(200).json({
      success: true,
      message: "Board deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid board ID format",
      });
    }
    console.error("deleteBoard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete board",
    });
  }
};

// COLUMNS
/**
 * POST /api/boards/:boardId/columns
 * Creates a new column on a board.
 * Body: { title: string }
 *
 * We auto-calculate the order by counting existing columns.
 * New column always gets appended to the right end.
 */
const createColumn = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { title } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Column title is required",
      });
    }

    // Verify the board exists before creating a column for it
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    // Count existing columns to determine the order for the new one.
    const columnCount = await Column.countDocuments({ boardId });

    const column = await Column.create({
      boardId,
      title: title.trim(),
      order: columnCount, // append to the end
    });

    // SOCKET EMIT
    // Notify all browsers viewing this board that a new column appeared.
    const io = req.app.get("io");
    io.to(boardId).emit("column:created", {
      column: { ...column.toObject(), cards: [] },
    });

    res.status(201).json({
      success: true,
      data: column,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid board ID format",
      });
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }
    console.error("createColumn error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create column",
    });
  }
};

/**
 * PATCH /api/boards/:boardId/columns/reorder
 * Reorders all columns on a board.
 * Body: { columns: [{ _id: string, order: number }, ...] }
 */
const reorderColumns = async (req, res) => {
  try {
    const { columns } = req.body;

    if (!Array.isArray(columns) || columns.length === 0) {
      return res.status(400).json({
        success: false,
        message: "columns array is required",
      });
    }

    const bulkOps = columns.map(({ _id, order }) => ({
      updateOne: {
        filter: { _id },
        update: { $set: { order } },
      },
    }));

    await Column.bulkWrite(bulkOps);

    res.status(200).json({
      success: true,
      message: "Columns reordered",
    });
  } catch (error) {
    console.error("reorderColumns error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reorder columns",
    });
  }
};

// Export all controller functions.
module.exports = {
  getAllBoards,
  createBoard,
  getBoardById,
  deleteBoard,
  createColumn,
  reorderColumns,
};
