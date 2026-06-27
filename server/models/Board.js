const mongoose = require("mongoose");

const boardSchema = new mongoose.Schema(
  {
    // The board's display name — required, trimmed of whitespace
    name: {
      type: String,
      required: [true, "Board name is required"],
      trim: true,
      maxlength: [100, "Board name cannot exceed 100 characters"],
    },

    // Optional description for the board
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
  },
  {
    // timestamps: true automatically adds createdAt and updatedAt fields.
    timestamps: true,
  },
);

module.exports = mongoose.model("Board", boardSchema);
