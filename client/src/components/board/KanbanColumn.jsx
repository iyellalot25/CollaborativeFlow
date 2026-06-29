// Displays one column on the kanban board.
// Renders its cards, handles adding new cards inline.

import { useState } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import cardService from "../../services/cardService";
import KanbanCard from "./KanbanCard";
import Input from "../ui/Input";
import Button from "../ui/Button";
import Spinner from "../ui/Spinner";

const KanbanColumn = ({ column, boardId, onCardCreated, onCardDeleted }) => {
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [titleError, setTitleError] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // useDroppable makes the entire column a valid drop target.
  // This is critical for two reasons:
  // 1. Empty columns have no cards so SortableContext alone has no drop surface
  // 2. When dragging between columns the overlay stays visible
  const { setNodeRef } = useDroppable({ id: column._id });

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
      onCardCreated(column._id, response.data);
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
    onCardDeleted(column._id, cardId);
  };

  const cardIds = column.cards.map((card) => card._id);

  return (
    <div className="flex-shrink-0 w-72 bg-gray-100 rounded-xl p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">{column.title}</h3>
        <span className="text-xs text-gray-400">{column.cards.length}</span>
      </div>

      {/* setNodeRef on the card list div registers the whole column
          area as a droppable surface — including when it is empty.
          min-h-[2px] ensures there is always a drop surface even
          when there are no cards. */}
      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="flex flex-col gap-2 min-h-[2px]">
          {column.cards.map((card) => (
            <KanbanCard
              key={card._id}
              card={card}
              onDelete={handleCardDeleted}
            />
          ))}
        </div>
      </SortableContext>

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
