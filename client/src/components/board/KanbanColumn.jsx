// Displays one column on the kanban board.
// Renders its cards, handles adding new cards inline.

import { useState } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import cardService from "../../services/cardService";
import KanbanCard from "./KanbanCard";
import Input from "../ui/Input";
import Button from "../ui/Button";
import Spinner from "../ui/Spinner";

// Props:
//   column   — { _id, title, order, cards: [] }
//   boardId  — needed for the createCard API call
//   onCardCreated — callback: (columnId, newCard) => void
//   onCardDeleted — callback: (columnId, cardId) => void
const KanbanColumn = ({ column, boardId, onCardCreated, onCardDeleted }) => {
  // Controls whether the inline "add card" form is visible
  const [showAddCard, setShowAddCard] = useState(false);

  // The new card title — controlled input
  const [newCardTitle, setNewCardTitle] = useState("");

  // Validation error for the card title
  const [titleError, setTitleError] = useState("");

  // Whether a card creation request is in flight
  const [isAdding, setIsAdding] = useState(false);

  const handleAddCard = async () => {
    if (!newCardTitle.trim()) {
      setTitleError("Card title is required");
      return;
    }
    setTitleError("");

    try {
      setIsAdding(true);
      const response = await cardService.createCard(
        boardId,
        column._id,
        newCardTitle.trim(),
      );

      // Tell the parent (KanbanBoard => BoardPage) about the new card.
      onCardCreated(column._id, response.data);

      // Reset form for the next card
      setNewCardTitle("");
    } catch (err) {
      setTitleError(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleCancelAdd = () => {
    setShowAddCard(false);
    setNewCardTitle("");
    setTitleError("");
  };

  const handleCardDeleted = (cardId) => {
    // Bubble the deletion up to the parent so the board state is updated
    onCardDeleted(column._id, cardId);
  };

  // Build the array of card IDs for SortableContext.
  const cardIds = column.cards.map((card) => card._id);

  return (
    // flex-shrink-0 prevents the column from compressing when the board is full
    <div className="flex-shrink-0 w-72 bg-gray-100 rounded-xl p-3">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">{column.title}</h3>
        {/* Card count badge */}
        <span className="text-xs text-gray-400">{column.cards.length}</span>
      </div>

      {/* Cards List */}
      <div className="flex flex-col gap-2">
        {column.cards.map((card) => (
          <KanbanCard key={card._id} card={card} onDelete={handleCardDeleted} />
        ))}
      </div>

      {/*
        SortableContext wraps the list of draggable cards.
      */}
      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {column.cards.map((card) => (
            <KanbanCard
              key={card._id}
              card={card}
              onDelete={handleCardDeleted}
            />
          ))}
        </div>
      </SortableContext>

      {/* Add Card Form — shown inline when showAddCard is true */}
      {showAddCard ? (
        <div className="mt-2 flex flex-col gap-2">
          <Input
            placeholder="Card title..."
            value={newCardTitle}
            onChange={(e) => {
              setNewCardTitle(e.target.value);
              if (titleError) setTitleError("");
            }}
            error={titleError}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddCard();
              if (e.key === "Escape") handleCancelAdd();
            }}
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAddCard} disabled={isAdding}>
              {isAdding ? (
                <span className="flex items-center gap-1.5">
                  <Spinner />
                  Adding...
                </span>
              ) : (
                "Add Card"
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancelAdd}
              disabled={isAdding}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        // "Add card" trigger button — always shown at the bottom of the column
        <button
          onClick={() => setShowAddCard(true)}
          className="w-full mt-2 p-2 text-sm text-gray-500 hover:bg-gray-200 rounded-lg text-left transition-colors"
        >
          + Add card
        </button>
      )}
    </div>
  );
};

export default KanbanColumn;
