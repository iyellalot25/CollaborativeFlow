// Arranges all columns horizontally on the board.
// Handles adding new columns.
// Passes card create/delete events up to BoardPage (which owns the state).

import { useState, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";

import boardService from "../../services/boardService";
import cardService from "../../services/cardService";
import KanbanColumn from "./KanbanColumn";
import Input from "../ui/Input";
import Button from "../ui/Button";
import Spinner from "../ui/Spinner";

const KanbanBoard = ({
  boardId,
  columns,
  onColumnAdded,
  onCardCreated,
  onCardDeleted,
  onCardMoved,
}) => {
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [columnTitleError, setColumnTitleError] = useState("");
  const [isAddingColumn, setIsAddingColumn] = useState(false);

  // activeCard drives the DragOverlay — what floats under the cursor
  const [activeCard, setActiveCard] = useState(null);

  // dragSourceRef captures the source column and card at dragStart.
  // Using a ref (not state) because:
  // 1. We don't want this to cause re-renders
  // 2. We need it to persist across the drag without being stale
  const dragSourceRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  // Finds which column contains a card with the given ID
  const findColumnByCardId = (cardId) => {
    return columns.find((col) =>
      col.cards.some((card) => card._id.toString() === cardId.toString()),
    );
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const sourceColumn = findColumnByCardId(active.id);
    if (!sourceColumn) return;

    const card = sourceColumn.cards.find(
      (c) => c._id.toString() === active.id.toString(),
    );

    // Capture source data at drag start into a ref.
    // handleDragEnd reads from this ref so it always has
    // the correct source even if columns prop changes mid-drag.
    dragSourceRef.current = { column: sourceColumn, card };
    setActiveCard(card);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    setActiveCard(null);

    if (!over) {
      dragSourceRef.current = null;
      return;
    }

    const source = dragSourceRef.current;
    dragSourceRef.current = null;
    if (!source) return;

    const activeCardId = active.id;
    const overId = over.id;
    const sourceColumn = source.column;

    // overId is either a card ID (dropped on a card)
    // or a column ID (dropped on an empty column via useDroppable)
    let targetColumn = findColumnByCardId(overId);
    if (!targetColumn) {
      targetColumn = columns.find(
        (col) => col._id.toString() === overId.toString(),
      );
    }
    if (!targetColumn) return;

    // Dropped card onto itself in same position — nothing to do
    if (
      sourceColumn._id.toString() === targetColumn._id.toString() &&
      activeCardId.toString() === overId.toString()
    )
      return;

    // Calculate insertion index in target column
    const targetCards = targetColumn.cards;
    const overCardIndex = targetCards.findIndex(
      (c) => c._id.toString() === overId.toString(),
    );
    const newOrder = overCardIndex >= 0 ? overCardIndex : targetCards.length;

    // Build the moved card from the ref-captured source card
    const movedCard = {
      ...source.card,
      columnId: targetColumn._id,
      order: newOrder,
    };

    // Optimistic update — move card in UI before server confirms
    onCardMoved(sourceColumn._id, targetColumn._id, movedCard);

    // Persist to database
    try {
      await cardService.moveCard(activeCardId, targetColumn._id, newOrder);
    } catch (err) {
      console.error("Failed to persist card move:", err);
    }
  };

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
      onColumnAdded({ ...response.data, cards: [] });
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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
