// Displays a single card on the kanban board.
// Receives card data as props — does not fetch its own data.
// Handles its own delete action.

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import cardService from "../../services/cardService";
import Spinner from "../ui/Spinner";

// Priority badge colors — semantic colors from DESIGN.md section 2
const PRIORITY_STYLES = {
  low: "bg-green-50 text-green-700",
  medium: "bg-yellow-50 text-yellow-700",
  high: "bg-red-50 text-red-700",
};

// Props:
//   card      — the full card object from the API
//   onDelete  — callback: (cardId) => void — tells parent to remove card from state
const KanbanCard = ({ card, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  // DND KIT — useSortable
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card._id });

  // CSS.Transform.toString() converts the transform object into a CSS string.
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleDelete = async (e) => {
    // Stop click from bubbling
    e.stopPropagation();

    if (!window.confirm(`Delete "${card.title}"?`)) return;

    try {
      setIsDeleting(true);
      await cardService.deleteCard(card._id);
      onDelete(card._id);
    } catch (err) {
      alert(`Failed to delete card: ${err.message}`);
      setIsDeleting(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        bg-white border border-gray-200 rounded-lg p-3
        hover:border-blue-300 hover:shadow-sm
        cursor-grab active:cursor-grabbing
        transition-all group
        ${isDragging ? "opacity-40" : "opacity-100"}
      `}
    >
      {/* Card Header: title + delete button */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900 leading-snug">
          {card.title}
        </p>

        {/* Delete button — only shown on hover */}
        {/* We stop propagation so clicking delete does not start a drag */}
        <button
          onClick={handleDelete}
          // onPointerDown stops the drag from starting when user clicks delete.
          // Without this pressing the delete button would begin dragging the card.
          onPointerDown={(e) => e.stopPropagation()}
          disabled={isDeleting}
          className="p-1 text-gray-400 rounded hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0 disabled:opacity-50"
          title="Delete card"
        >
          {isDeleting ? <Spinner /> : "✕"}
        </button>
      </div>

      {/* Description */}
      {card.description && (
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
          {card.description}
        </p>
      )}

      {/* Footer: priority + labels + assignee */}
      <div className="flex flex-wrap items-center gap-1.5 mt-2">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_STYLES[card.priority]}`}
        >
          {card.priority}
        </span>

        {card.labels &&
          card.labels.map((label) => (
            <span
              key={label}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600"
            >
              {label}
            </span>
          ))}

        {card.assignee && (
          <span className="ml-auto text-xs text-gray-400 truncate max-w-[80px]">
            {card.assignee}
          </span>
        )}
      </div>
    </div>
  );
};

export default KanbanCard;
