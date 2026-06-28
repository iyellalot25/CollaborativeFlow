// Arranges all columns horizontally on the board.
// Handles adding new columns.
// Passes card create/delete events up to BoardPage (which owns the state).

import { useState } from "react";
import boardService from "../../services/boardService";
import KanbanColumn from "./KanbanColumn";
import Input from "../ui/Input";
import Button from "../ui/Button";
import Spinner from "../ui/Spinner";

// Props:
//   boardId       — the board's _id
//   columns       — array of column objects (each with a .cards array)
//   onColumnAdded — callback: (newColumn) => void
//   onCardCreated — callback: (columnId, newCard) => void
//   onCardDeleted — callback: (columnId, cardId) => void
const KanbanBoard = ({
  boardId,
  columns,
  onColumnAdded,
  onCardCreated,
  onCardDeleted,
}) => {
  // Controls whether the "Add Column" form is visible
  const [showAddColumn, setShowAddColumn] = useState(false);

  // New column title — controlled input
  const [newColumnTitle, setNewColumnTitle] = useState("");

  // Validation error for the column title
  const [columnTitleError, setColumnTitleError] = useState("");

  // Whether a column creation request is in flight
  const [isAddingColumn, setIsAddingColumn] = useState(false);

  const handleAddColumn = async () => {
    if (!newColumnTitle.trim()) {
      setColumnTitleError("Column title is required");
      return;
    }
    setColumnTitleError("");

    try {
      setIsAddingColumn(true);
      const response = await boardService.createColumn(
        boardId,
        newColumnTitle.trim(),
      );

      // The new column has no cards yet — add an empty cards array
      onColumnAdded({ ...response.data, cards: [] });

      // Reset form but keep it open — common kanban UX pattern
      // (user often wants to add multiple columns in a row)
      setNewColumnTitle("");
    } catch (err) {
      setColumnTitleError(err.message);
    } finally {
      setIsAddingColumn(false);
    }
  };

  const handleCancelAddColumn = () => {
    setShowAddColumn(false);
    setNewColumnTitle("");
    setColumnTitleError("");
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 items-start">
      {/* Render each column */}
      {columns.map((column) => (
        <KanbanColumn
          key={column._id}
          column={column}
          boardId={boardId}
          onCardCreated={onCardCreated}
          onCardDeleted={onCardDeleted}
        />
      ))}

      {/* Add Column — either the form or the trigger button */}
      {showAddColumn ? (
        // Add column form — same width as a column (w-72) for visual consistency
        <div className="flex-shrink-0 w-72 bg-gray-100 rounded-xl p-3">
          <div className="flex flex-col gap-2">
            <Input
              placeholder="Column title..."
              value={newColumnTitle}
              onChange={(e) => {
                setNewColumnTitle(e.target.value);
                if (columnTitleError) setColumnTitleError("");
              }}
              error={columnTitleError}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddColumn();
                if (e.key === "Escape") handleCancelAddColumn();
              }}
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAddColumn}
                disabled={isAddingColumn}
              >
                {isAddingColumn ? (
                  <span className="flex items-center gap-1.5">
                    <Spinner />
                    Adding...
                  </span>
                ) : (
                  "Add Column"
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancelAddColumn}
                disabled={isAddingColumn}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // "Add a column" trigger
        <button
          onClick={() => setShowAddColumn(true)}
          className="flex-shrink-0 w-72 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm text-gray-500 transition-colors"
        >
          + Add a column
        </button>
      )}
    </div>
  );
};

export default KanbanBoard;
