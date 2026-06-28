// Displays a single card on the kanban board.
// Receives card data as props — does not fetch its own data.
// Handles its own delete action.

import { useState } from "react";
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
    <div className="bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all group">
      {/* Card Header: title + delete button */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900 leading-snug">
          {card.title}
        </p>

        {/* Delete button — visible on hover only */}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-1 text-gray-400 rounded hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0 disabled:opacity-50"
          title="Delete card"
        >
          {isDeleting ? <Spinner /> : "✕"}
        </button>
      </div>

      {/* Description — only shown if it exists */}
      {card.description && (
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
          {card.description}
        </p>
      )}

      {/* Card Footer: priority badge + labels + assignee */}
      <div className="flex flex-wrap items-center gap-1.5 mt-2">
        {/* Priority badge — semantic color from PRIORITY_STYLES map */}
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_STYLES[card.priority]}`}
        >
          {card.priority}
        </span>

        {/* Label badges */}
        {card.labels &&
          card.labels.map((label) => (
            <span
              key={label}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600"
            >
              {label}
            </span>
          ))}

        {/* Assignee — shown at the far right if present */}
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
