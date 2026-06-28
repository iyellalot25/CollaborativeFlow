// The main board view. Fetches one board with all its columns and cards.
// Owns all board state — passes it down to KanbanBoard via props.
// Handles card and column state updates from child component callbacks.

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import boardService from "../services/boardService";
import KanbanBoard from "../components/board/KanbanBoard";
import Spinner from "../components/ui/Spinner";

const BoardPage = () => {
  // useParams reads the :boardId segment from the URL
  const { boardId } = useParams();

  // The board metadata (name, description)
  const [board, setBoard] = useState(null);

  // Array of column objects, each with a .cards array attached
  // This is the single source of truth for the entire board UI
  const [columns, setColumns] = useState([]);

  // Loading and error states for the initial fetch
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // DATA FETCHING

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await boardService.getBoardById(boardId);
        // response.data = { board: {...}, columns: [{...cards: []}] }
        setBoard(response.data.board);
        setColumns(response.data.columns);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoard();
  }, [boardId]); // Re-fetch if the boardId in the URL changes

  // STATE UPDATE HANDLERS
  // These are passed as callbacks to KanbanBoard => KanbanColumn => KanbanCard
  // When a child creates/deletes something, it calls these to update state here.

  /**
   * Called by KanbanBoard when a new column is successfully created.
   * Appends the new column (with empty cards array) to the columns state.
   */
  const handleColumnAdded = (newColumn) => {
    setColumns((prev) => [...prev, newColumn]);
  };

  /**
   * Called by KanbanColumn when a new card is successfully created.
   * Finds the right column by columnId and appends the card to its cards array.
   */
  const handleCardCreated = (columnId, newCard) => {
    setColumns((prev) =>
      prev.map((col) =>
        col._id === columnId ? { ...col, cards: [...col.cards, newCard] } : col,
      ),
    );
  };

  /**
   * Called by KanbanCard when a card is successfully deleted.
   * Finds the right column and removes the card from its cards array.
   */
  const handleCardDeleted = (columnId, cardId) => {
    setColumns((prev) =>
      prev.map((col) =>
        col._id === columnId
          ? { ...col, cards: col.cards.filter((c) => c._id !== cardId) }
          : col,
      ),
    );
  };

  // RENDER — LOADING

  if (isLoading) {
    return <Spinner fullPage message="Loading board..." />;
  }

  // RENDER — ERROR

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-500 mb-4">{error}</p>
          <Link to="/boards" className="text-blue-600 hover:underline text-sm">
            ← Back to boards
          </Link>
        </div>
      </div>
    );
  }

  // RENDER — MAIN BOARD

  return (
    // Full-height layout — no page scroll, board scrolls horizontally internally
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 flex-shrink-0">
        {/* Back link */}
        <Link
          to="/boards"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Boards
        </Link>

        {/* Divider */}
        <span className="text-gray-200">|</span>

        {/* Board name */}
        <h1 className="text-sm font-semibold text-gray-900">{board?.name}</h1>

        {/* Description — secondary text, hidden if empty */}
        {board?.description && (
          <p className="text-sm text-gray-500 truncate max-w-xs">
            {board.description}
          </p>
        )}
      </nav>

      {/* Board Area — fills remaining height, scrolls horizontally */}
      <main className="flex-1 overflow-hidden p-6">
        <KanbanBoard
          boardId={boardId}
          columns={columns}
          onColumnAdded={handleColumnAdded}
          onCardCreated={handleCardCreated}
          onCardDeleted={handleCardDeleted}
        />
      </main>
    </div>
  );
};

export default BoardPage;
