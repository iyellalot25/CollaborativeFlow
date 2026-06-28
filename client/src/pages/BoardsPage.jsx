// The main landing page after the home screen.
// Shows all boards, allows creating a new board.

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import boardService from "../services/boardService";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Spinner from "../components/ui/Spinner";

const BoardsPage = () => {
  // STATE

  // The list of boards fetched from the API
  const [boards, setBoards] = useState([]);

  // Whether the initial board list is loading
  const [isLoading, setIsLoading] = useState(true);

  // Error message for the board list fetch (null = no error)
  const [error, setError] = useState(null);

  // Controls whether the "Create Board" form panel is visible
  const [showCreateForm, setShowCreateForm] = useState(false);

  // The new board's name — controlled by the text input
  const [newBoardName, setNewBoardName] = useState("");

  // The new board's description — optional
  const [newBoardDescription, setNewBoardDescription] = useState("");

  // Validation error for the name field
  const [nameError, setNameError] = useState("");

  // Whether a create request is in flight
  const [isCreating, setIsCreating] = useState(false);

  // useNavigate lets us programmatically redirect to another page
  const navigate = useNavigate();

  // DATA FETCHING

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await boardService.getAllBoards();
        // response.data is the array of boards from our API shape:
        // { success: true, count: N, data: [...] }
        setBoards(response.data);
      } catch (err) {
        // err.message comes from the Error we throw in the service layer
        setError(err.message);
      } finally {
        // finally runs whether the try succeeded or the catch ran.
        // Guarantees loading spinner always turns off.
        setIsLoading(false);
      }
    };

    fetchBoards();
  }, []); //

  // HANDLERS

  const handleCreateBoard = async () => {
    // Client-side validation before hitting the network
    if (!newBoardName.trim()) {
      setNameError("Board name is required");
      return;
    }
    setNameError("");

    try {
      setIsCreating(true);
      const response = await boardService.createBoard(
        newBoardName.trim(),
        newBoardDescription.trim(),
      );

      // Navigate directly to the new board instead of adding it to the list.
      // This gives immediate feedback — user lands on their new board.
      navigate(`/boards/${response.data._id}`);
    } catch (err) {
      setNameError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancelCreate = () => {
    // Reset the form and hide the panel
    setShowCreateForm(false);
    setNewBoardName("");
    setNewBoardDescription("");
    setNameError("");
  };

  const handleDeleteBoard = async (boardId, boardName) => {
    // window.confirm is the simplest confirmation pattern for now.
    if (!window.confirm(`Delete "${boardName}"? This cannot be undone.`)) {
      return;
    }

    try {
      await boardService.deleteBoard(boardId);
      // Remove the deleted board from local state.
      // We don't re-fetch all boards — we just filter out the deleted one.
      // This is faster and avoids a network round-trip.
      setBoards((prev) => prev.filter((b) => b._id !== boardId));
    } catch (err) {
      alert(`Failed to delete board: ${err.message}`);
    }
  };

  // RENDER — LOADING STATE

  if (isLoading) {
    return <Spinner fullPage message="Loading boards..." />;
  }

  // RENDER — ERROR STATE

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  // RENDER — MAIN PAGE

  return (
    // Page layout from DESIGN.md section 6.1
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900">
          CollaborativeFlow AI
        </span>
        <Button onClick={() => setShowCreateForm(true)}>+ New Board</Button>
      </nav>

      {/* Page Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Boards</h1>
          <p className="text-sm text-gray-500 mt-1">
            {boards.length} {boards.length === 1 ? "board" : "boards"}
          </p>
        </div>

        {/* Create Board Form Panel */}
        {showCreateForm && (
          // Elevated card style from DESIGN.md section 5.3
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6 max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Create a new board
            </h2>

            <div className="flex flex-col gap-4">
              <Input
                label="Board Name"
                placeholder="e.g. Sprint 12, Product Roadmap"
                value={newBoardName}
                onChange={(e) => {
                  setNewBoardName(e.target.value);
                  // Clear error as soon as the user starts typing
                  if (nameError) setNameError("");
                }}
                error={nameError}
                // Allow submitting with Enter key
                onKeyDown={(e) => e.key === "Enter" && handleCreateBoard()}
                autoFocus
              />

              <Input
                label="Description (optional)"
                placeholder="What is this board for?"
                multiline
                rows={2}
                value={newBoardDescription}
                onChange={(e) => setNewBoardDescription(e.target.value)}
              />

              <div className="flex gap-3">
                <Button onClick={handleCreateBoard} disabled={isCreating}>
                  {isCreating ? (
                    // Show spinner inside the button while creating
                    <span className="flex items-center gap-2">
                      <Spinner />
                      Creating...
                    </span>
                  ) : (
                    "Create Board"
                  )}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleCancelCreate}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Board List or Empty State */}
        {boards.length === 0 ? (
          // Empty state from DESIGN.md section 5.7
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <span className="text-gray-400 text-xl">📋</span>
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              No boards yet
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Create your first board to get started.
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              Create First Board
            </Button>
          </div>
        ) : (
          // Board Grid
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board) => (
              <BoardCard
                key={board._id}
                board={board}
                onDelete={handleDeleteBoard}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

// BOARD CARD SUB-COMPONENT
// A single board preview card in the grid.
// Extracted to keep BoardsPage's return block readable.

const BoardCard = ({ board, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e) => {
    // Without thisclicking Delete would BOTH navigate to the board
    // AND trigger the delete handler.
    e.preventDefault();
    e.stopPropagation();

    setIsDeleting(true);
    await onDelete(board._id, board.name);
    setIsDeleting(false);
  };

  return (
    // Link wraps the whole card — clicking anywhere navigates to the board
    <Link
      to={`/boards/${board._id}`}
      className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {/* Card Title — text-sm font-semibold per DESIGN.md */}
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {board.name}
          </h3>

          {/* Description — secondary text style */}
          {board.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {board.description}
            </p>
          )}

          {/* Timestamp — caption style */}
          <p className="text-xs text-gray-400 mt-2">
            Created {new Date(board.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Delete button — icon button, only visible on hover */}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-1.5 text-gray-400 rounded hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
          title="Delete board"
        >
          {isDeleting ? <Spinner /> : "✕"}
        </button>
      </div>
    </Link>
  );
};

export default BoardsPage;
