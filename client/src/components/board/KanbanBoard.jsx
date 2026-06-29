// Arranges all columns horizontally on the board.
// Handles adding new columns.
// Passes card create/delete events up to BoardPage (which owns the state).

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

import boardService from "../../services/boardService";
import cardService from "../../services/cardService";
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
  onCardMoved,
}) => {
  // Controls whether the "Add Column" form is visible
  const [showAddColumn, setShowAddColumn] = useState(false);

  // New column title — controlled input
  const [newColumnTitle, setNewColumnTitle] = useState("");

  // Validation error for the column title
  const [columnTitleError, setColumnTitleError] = useState("");

  // Whether a column creation request is in flight
  const [isAddingColumn, setIsAddingColumn] = useState(false);

  // DRAG STATE
  // activeCard holds the full card object while dragging.
  const [activeCard, setActiveCard] = useState(null);

  // SENSORS
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  // HELPERS — find which column a card belongs to

  const findColumnByCardId = (cardId) => {
    return columns.find((col) =>
      col.cards.some((card) => card._id.toString() === cardId.toString()),
    );
  };

  // DRAG HANDLERS

  const handleDragStart = (event) => {
    const { active } = event;

    // Find the full card object so we can render it in DragOverlay
    const sourceColumn = findColumnByCardId(active.id);
    if (!sourceColumn) return;

    const card = sourceColumn.cards.find(
      (c) => c._id.toString() === active.id.toString(),
    );
    setActiveCard(card);
  };

  // onDragEnd fires when the user releases the card.
  const handleDragEnd = async (event) => {
    const { active, over } = event;

    // Clear the drag overlay regardless of outcome
    setActiveCard(null);

    // over is null if the card was dropped in an invalid area (outside any column)
    if (!over) return;

    const activeCardId = active.id; // ID of the card being moved
    const overId = over.id; // ID of what it was dropped ON (card or column)

    // Find source column (where the card came from)
    const sourceColumn = findColumnByCardId(activeCardId);
    if (!sourceColumn) return;

    // Find target column.
    // The user might drop ONTO another card (overId is a card ID)
    // or onto an empty column (overId is a column ID).
    // We check both cases.
    let targetColumn = findColumnByCardId(overId);

    // If overId didn't match any card, check if it matches a column directly.
    // This handles the "empty column" drop case.
    if (!targetColumn) {
      targetColumn = columns.find(
        (col) => col._id.toString() === overId.toString(),
      );
    }

    // Still no target — invalid drop, do nothing
    if (!targetColumn) return;

    // If dropped in the same position in the same column — nothing to do
    if (
      sourceColumn._id.toString() === targetColumn._id.toString() &&
      activeCardId.toString() === overId.toString()
    )
      return;

    // Determine new order value
    // Strategy: find the index of the card it was dropped ON,
    // then give our card that same index (pushing others down).
    // If dropped on an empty column or at the end, append to the end.
    const targetCards = targetColumn.cards;
    const overCardIndex = targetCards.findIndex(
      (c) => c._id.toString() === overId.toString(),
    );

    // If we found a card to drop onto, use its index as position.
    // Otherwise (dropped on empty column or column header area), append at end.
    const newOrder = overCardIndex >= 0 ? overCardIndex : targetCards.length;

    // Optimistic UI update
    // Update the columns state immediately so the user sees the move
    // happen instantly — before the API call completes.
    const movedCard = {
      ...sourceColumn.cards.find((c) => c._id === activeCardId.toString()),
      columnId: targetColumn._id,
      order: newOrder,
    };

    onCardMoved(sourceColumn._id, targetColumn._id, movedCard);

    // Persist to database
    // Fire and forget — we already updated the UI optimistically.
    try {
      await cardService.moveCard(activeCardId, targetColumn._id, newOrder);
      // The API call triggers the server to emit card:moved via socket
      // which updates all OTHER tabs.
    } catch (err) {
      console.error("Failed to persist card move:", err);
      // We have intentionally NOT revert the optimistic update here. (will fix conflicts later)
    }
  };

  //COLUMN HANDLERS
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
    /*
      DndContext is the outermost wrapper for everything draggable.
    */
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Board horizontal scroll layout — unchanged from Phase 3 */}
      <div className="flex gap-4 overflow-x-auto pb-4 items-start">
        {columns.map((column) => (
          <KanbanColumn
            key={column._id}
            column={column}
            boardId={boardId}
            onCardCreated={onCardCreated}
            onCardDeleted={onCardDeleted}
          />
        ))}

        {/* Add Column form/button — unchanged */}
        {showAddColumn ? (
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
          <button
            onClick={() => setShowAddColumn(true)}
            className="flex-shrink-0 w-72 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm text-gray-500 transition-colors"
          >
            + Add a column
          </button>
        )}
      </div>

      {/*
        DragOverlay renders a floating copy of the card that follows the cursor.
      */}
      <DragOverlay>
        {activeCard ? (
          <div className="bg-white border border-blue-300 shadow-lg rounded-lg p-3 w-72 cursor-grabbing rotate-1">
            <p className="text-sm font-semibold text-gray-900">
              {activeCard.title}
            </p>
            {activeCard.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {activeCard.description}
              </p>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
export default KanbanBoard;
