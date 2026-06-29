// The main board view. Fetches one board with all its columns and cards.
// Owns all board state — passes it down to KanbanBoard via props.
// Handles card and column state updates from child component callbacks.

import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import boardService from "../services/boardService";
import KanbanBoard from "../components/board/KanbanBoard";
import Spinner from "../components/ui/Spinner";
import useSocket from "../hooks/useSocket";

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

  //connection states
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  // SOCKET CONNECTION
  // useSocket connects to the server, joins the board room and returns
  // the socket instance. We pass boardId so it knows which room to join.
  // The hook handles all connection/disconnection lifecycle automatically.
  const socket = useSocket(boardId);

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

  /**
   * Called when a card:updated socket event arrives.
   * Finds the card inside its column and replaces it with the updated version.
   * columnId tells us which column contains the card — avoids searching all columns.
   */
  const handleCardUpdated = (columnId, updatedCard) => {
    setColumns((prev) =>
      prev.map((col) =>
        col._id === columnId
          ? {
              ...col,
              cards: col.cards.map((c) =>
                c._id === updatedCard._id ? updatedCard : c,
              ),
            }
          : col,
      ),
    );
  };

  /**
   * Called when a card:moved socket event arrives.
   * Must update TWO columns atomically:
   *   1. Remove the card from sourceColumnId
   *   2. Add the card to targetColumnId
   *
   * We use a single setColumns call with map so React batches the update
   * into one render pass — no flash of intermediate state.
   */
  const handleCardMoved = (sourceColumnId, targetColumnId, movedCard) => {
    setColumns((prev) =>
      prev.map((col) => {
        // Remove from source column
        if (col._id === sourceColumnId) {
          return {
            ...col,
            cards: col.cards.filter((c) => c._id !== movedCard._id),
          };
        }
        // Add to target column
        if (col._id === targetColumnId) {
          return {
            ...col,
            // Append then sort by order so the card lands in the right position.
            // The server normalizes order values after a move,
            // so sorting by order gives us the correct visual sequence.
            cards: [...col.cards, movedCard].sort((a, b) => a.order - b.order),
          };
        }
        // All other columns — return unchanged
        return col;
      }),
    );
  };

  // SOCKET EVENT LISTENERS

  useEffect(() => {
    // Guard: socket might be null on the very first render because
    // useSocket's useEffect hasn't run yet (effects run after render).
    // We wait until socket is available before registering listeners.
    if (!socket) return;

    // Connection Status Handlers
    const handleConnect = () => setConnectionStatus("connected");
    const handleDisconnect = () => setConnectionStatus("reconnecting");

    // Sync current status if socket is already active/inactive when effect runs
    if (socket.connected) {
      setConnectionStatus("connected");
    } else {
      setConnectionStatus("connecting");
    }

    // card:created
    // Fired by the server when ANY user adds a card to this board.
    // Payload: { columnId, card }
    //
    // DUPLICATE HANDLING:
    // The user who created the card already updated their own state
    // via the REST response in KanbanColumn. So they'll receive this
    // socket event and try to add the card AGAIN.
    //
    // Solution: check if the card already exists before adding.
    // We do this inside handleCardCreated by checking card._id.
    // Actually — simpler: we check before calling the handler at all.
    const handleCardCreatedEvent = ({ columnId, card }) => {
      setColumns((prev) => {
        // Find the column this card belongs to
        const column = prev.find((col) => col._id === columnId);
        if (!column) return prev; // column not found — shouldn't happen

        // Check if this card already exists in state (i.e., we're the creator)
        const alreadyExists = column.cards.some((c) => c._id === card._id);
        if (alreadyExists) return prev; // skip — we already have this card

        // Card is new to us — add it
        return prev.map((col) =>
          col._id === columnId ? { ...col, cards: [...col.cards, card] } : col,
        );
      });
    };

    // card:updated
    // Payload: { columnId, card }
    const handleCardUpdatedEvent = ({ columnId, card }) => {
      handleCardUpdated(columnId, card);
    };

    // card:deleted
    // Payload: { columnId, cardId }
    const handleCardDeletedEvent = ({ columnId, cardId }) => {
      handleCardDeleted(columnId, cardId.toString());
    };

    // card:moved
    // Payload: { cardId, sourceColumnId, targetColumnId, card }
    const handleCardMovedEvent = ({ sourceColumnId, targetColumnId, card }) => {
      handleCardMoved(
        sourceColumnId.toString(),
        targetColumnId.toString(),
        card,
      );
    };

    // column:created
    // Payload: { column } (column already has cards: [] attached by the server)
    const handleColumnCreatedEvent = ({ column }) => {
      setColumns((prev) => {
        // Duplicate check — same pattern as card:created
        const alreadyExists = prev.some((col) => col._id === column._id);
        if (alreadyExists) return prev;
        return [...prev, column];
      });
    };

    // Register all listeners
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("card:created", handleCardCreatedEvent);
    socket.on("card:updated", handleCardUpdatedEvent);
    socket.on("card:deleted", handleCardDeletedEvent);
    socket.on("card:moved", handleCardMovedEvent);
    socket.on("column:created", handleColumnCreatedEvent);

    // CLEANUP
    // When this useEffect re-runs (if socket changes) or when
    // the component unmounts, we remove these specific listeners.
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("card:created", handleCardCreatedEvent);
      socket.off("card:updated", handleCardUpdatedEvent);
      socket.off("card:deleted", handleCardDeletedEvent);
      socket.off("card:moved", handleCardMovedEvent);
      socket.off("column:created", handleColumnCreatedEvent);
    };

    // socket is in the dependency array.
    // If socket changes (reconnection) this effect re-runs and
    // re-registers listeners on the new socket instance.
  }, [socket]);

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

        {/* Dynamic real-time connection status indicator */}
        <div className="ml-auto flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              connectionStatus === "connected"
                ? "bg-green-500"
                : connectionStatus === "reconnecting"
                  ? "bg-red-500"
                  : "bg-gray-400"
            }`}
          />
          <span className="text-xs text-gray-500 font-medium">
            {connectionStatus === "connected" && "Live"}
            {connectionStatus === "reconnecting" && "Reconnecting..."}
            {connectionStatus === "connecting" && "Connecting..."}
          </span>
        </div>
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
