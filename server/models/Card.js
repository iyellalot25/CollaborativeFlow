const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema(
  {
    // Which column this card currently lives in.
    // changes when the card is moved (dnd)
    columnId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Column",
      required: [true, "columnId is required"],
    },

    // Stored directly on the card for performance.
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      required: [true, "boardId is required"],
    },

    // The card's main title — shown on the kanban card face
    title: {
      type: String,
      required: [true, "Card title is required"],
      trim: true,
      maxlength: [200, "Card title cannot exceed 200 characters"],
    },

    // Longer description — shown when a card is opened/expanded
    description: {
      type: String,
      trim: true,
      default: "",
    },

    // Priority level — controls badge color on the card
    priority: {
      type: String,
      enum: {
        values: ["low", "medium", "high"],
        message: "Priority must be low, medium, or high",
      },
      default: "medium",
    },

    // Free-form tags — e.g. ["bug", "frontend", "auth"]
    labels: {
      type: [String],
      default: [],
    },

    // Assignee name — plain string
    // No user accounts yet (no auth for now)
    assignee: {
      type: String,
      trim: true,
      default: "",
    },

    // Controls top-to-bottom position within a column.
    // Lower number = higher up in the column.
    order: {
      type: Number,
      required: true,
      default: 0,
    },

    // GitHub Issues import stores the issue number here.
    // Used for deduplication — prevents importing the same issue twice.
    githubIssueId: {
      type: Number,
      default: null,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index:
cardSchema.index({ columnId: 1, order: 1 });

cardSchema.index({ boardId: 1 });

module.exports = mongoose.model("Card", cardSchema);
