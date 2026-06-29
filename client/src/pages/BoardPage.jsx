// The main board view. Fetches one board with all its columns and cards.
// Owns all board state — passes it down to KanbanBoard via props.
// Handles card and column state updates from child component callbacks.

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import boardService from "../services/boardService";
import KanbanBoard from "../components/board/KanbanBoard";
import Spinner from "../components/ui/Spinner";
import useSocket from "../hooks/useSocket";

// Normalizes all _id fields in the board data to plain strings.
// MongoDB ObjectIds serialize inconsistently — this ensures every
// ID in state is a string, matching socket payloads and Dnd Kit IDs.
const normalizeIds = (columns) =>
  columns.map((col) => ({
    ...col,
    _id: col._id.toString(),
    cards: col.cards.map((card) => ({
      ...card,
      _id: card._id.toString(),
      columnId: card.columnId.toString(),
      boardId: card.boardId.toString(),
    })),
  }));

const BoardPage = () => {
  const { boardId } = useParams();

  const [board, setBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  const socket = useSocket(boardId);

  // DATA FETCHING

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await boardService.getBoardById(boardId);
        setBoard(response.data.board);
        // Normalize all IDs to strings at the point of entry
        setColumns(normalizeIds(response.data.columns));
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBoard();
  }, [boardId]);

  // STATE UPDATE HANDLERS

  const handleColumnAdded = (newColumn) => {
    setColumns((prev) => [
      ...prev,
      {
        ...newColumn,
        _id: newColumn._id.toString(),
        cards: [],
      },
    ]);
  };

  const handleCardCreated = (columnId, newCard) => {
    setColumns((prev) =>
      prev.map((col) =>
        col._id === columnId.toString()
          ? {
              ...col,
              cards: [
                ...col.cards,
                {
                  ...newCard,
                  _id: newCard._id.toString(),
                  columnId: newCard.columnId.toString(),
                  boardId: newCard.boardId.toString(),
                },
              ],
            }
          : col,
      ),
    );
  };

  const handleCardDeleted = (columnId, cardId) => {
    setColumns((prev) =>
      prev.map((col) =>
        col._id === columnId.toString()
          ? {
              ...col,
              cards: col.cards.filter((c) => c._id !== cardId.toString()),
            }
          : col,
      ),
    );
  };

  const handleCardUpdated = (columnId, updatedCard) => {
    setColumns((prev) =>
      prev.map((col) =>
        col._id === columnId.toString()
          ? {
              ...col,
              cards: col.cards.map((c) =>
                c._id === updatedCard._id.toString()
                  ? { ...updatedCard, _id: updatedCard._id.toString() }
                  : c,
              ),
            }
          : col,
      ),
    );
  };

  // Called by KanbanBoard for optimistic update on drag.
  // movedCard already has normalized IDs (built from state in KanbanBoard).
  const handleCardMoved = (sourceColumnId, targetColumnId, movedCard) => {
    setColumns((prev) =>
      prev.map((col) => {
        if (col._id === sourceColumnId.toString()) {
          return {
            ...col,
            cards: col.cards.filter((c) => c._id !== movedCard._id),
          };
        }
        if (col._id === targetColumnId.toString()) {
          return {
            ...col,
            cards: [...col.cards, movedCard].sort((a, b) => a.order - b.order),
          };
        }
        return col;
      }),
    );
  };

  // SOCKET EVENT LISTENERS

  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => setConnectionStatus("connected");
    const handleDisconnect = () => setConnectionStatus("reconnecting");

    if (socket.connected) {
      setConnectionStatus("connected");
    } else {
      setConnectionStatus("connecting");
    }

    // card:created
    // Deduplication: if the card already exists in state, we created it
    // ourselves via the REST response. Skip to avoid duplicates.
    const handleCardCreatedEvent = ({ columnId, card }) => {
      setColumns((prev) => {
        const col = prev.find((c) => c._id === columnId.toString());
        if (!col) return prev;

        const alreadyExists = col.cards.some(
          (c) => c._id === card._id.toString(),
        );
        if (alreadyExists) return prev;

        return prev.map((c) =>
          c._id === columnId.toString()
            ? {
                ...c,
                cards: [
                  ...c.cards,
                  {
                    ...card,
                    _id: card._id.toString(),
                    columnId: card.columnId.toString(),
                    boardId: card.boardId.toString(),
                  },
                ],
              }
            : c,
        );
      });
    };

    // card:updated
    const handleCardUpdatedEvent = ({ columnId, card }) => {
      handleCardUpdated(columnId, card);
    };

    // card:deleted
    const handleCardDeletedEvent = ({ columnId, cardId }) => {
      handleCardDeleted(columnId.toString(), cardId.toString());
    };

    // card:moved
    // Deduplication: if the card is already in the target column,
    // the optimistic update already placed it there. Skip.
    const handleCardMovedEvent = ({ sourceColumnId, targetColumnId, card }) => {
      setColumns((prev) => {
        const targetCol = prev.find(
          (col) => col._id === targetColumnId.toString(),
        );
        if (!targetCol) return prev;

        const alreadyInTarget = targetCol.cards.some(
          (c) => c._id === card._id.toString(),
        );
        if (alreadyInTarget) return prev;

        // Remote move from another user — apply it
        return prev.map((col) => {
          if (col._id === sourceColumnId.toString()) {
            return {
              ...col,
              cards: col.cards.filter((c) => c._id !== card._id.toString()),
            };
          }
          if (col._id === targetColumnId.toString()) {
            return {
              ...col,
              cards: [
                ...col.cards,
                {
                  ...card,
                  _id: card._id.toString(),
                  columnId: card.columnId.toString(),
                  boardId: card.boardId.toString(),
                },
              ].sort((a, b) => a.order - b.order),
            };
          }
          return col;
        });
      });
    };

    // column:created
    const handleColumnCreatedEvent = ({ column }) => {
      setColumns((prev) => {
        const alreadyExists = prev.some(
          (col) => col._id === column._id.toString(),
        );
        if (alreadyExists) return prev;
        return [...prev, { ...column, _id: column._id.toString(), cards: [] }];
      });
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("card:created", handleCardCreatedEvent);
    socket.on("card:updated", handleCardUpdatedEvent);
    socket.on("card:deleted", handleCardDeletedEvent);
    socket.on("card:moved", handleCardMovedEvent);
    socket.on("column:created", handleColumnCreatedEvent);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("card:created", handleCardCreatedEvent);
      socket.off("card:updated", handleCardUpdatedEvent);
      socket.off("card:deleted", handleCardDeletedEvent);
      socket.off("card:moved", handleCardMovedEvent);
      socket.off("column:created", handleColumnCreatedEvent);
    };
  }, [socket]);

  // RENDER — LOADING
  if (isLoading) return <Spinner fullPage message="Loading board..." />;

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 flex-shrink-0">
        <Link
          to="/boards"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Boards
        </Link>

        <span className="text-gray-200">|</span>

        <h1 className="text-sm font-semibold text-gray-900">{board?.name}</h1>

        {board?.description && (
          <p className="text-sm text-gray-500 truncate max-w-xs">
            {board.description}
          </p>
        )}

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

      {/* Board Area */}
      <main className="flex-1 overflow-hidden p-6">
        <KanbanBoard
          boardId={boardId}
          columns={columns}
          onColumnAdded={handleColumnAdded}
          onCardCreated={handleCardCreated}
          onCardDeleted={handleCardDeleted}
          onCardMoved={handleCardMoved}
        />
      </main>
    </div>
  );
};

export default BoardPage;
