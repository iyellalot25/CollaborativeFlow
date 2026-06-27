const mongoose = require("mongoose");

const columnSchema = new mongoose.Schema(
  {
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      required: [true, "boardId is required"],
    },

    // The column header text — shown at the top of each kanban column
    title: {
      type: String,
      required: [true, "Column title is required"],
      trim: true,
      maxlength: [50, "Column title cannot exceed 50 characters"],
    },

    // Controls left-to-right display order of columns on the board.
    // Lower number = further left.
    // When a column is created assign the next available integer.
    order: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

columnSchema.index({ boardId: 1, order: 1 }); //Ascending

module.exports = mongoose.model("Column", columnSchema);
