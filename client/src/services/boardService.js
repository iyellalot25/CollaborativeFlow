// All API calls related to boards and columns live here.

const API_BASE = import.meta.env.VITE_API_URL || "";

// HELPER

/**
 * Centralized fetch wrapper.
 * Handles JSON parsing and error throwing in one place.
 * All service functions call this instead of raw fetch().
 *
 * @param {string} endpoint  - e.g. "/api/boards"
 * @param {object} options   - fetch options (method, body, headers)
 * @returns {object}         - parsed JSON response data
 * @throws {Error}           - if response is not OK, throws with server message
 */
const request = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    // Default headers
    headers: {
      "Content-Type": "application/json",
      ...options.headers, // allow callers to override/add headers
    },
    ...options,
  });

  // Parse the JSON body
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
};

// BOARD FUNCTIONS

/**
 * Fetch all boards.
 * Used by BoardsPage to display the list of projects.
 * @returns {{ success, count, data: Board[] }}
 */
const getAllBoards = async () => {
  return request("/api/boards");
};

/**
 * Fetch a single board with all its columns and cards.
 * Used by BoardPage to render the full kanban view.
 * @param {string} boardId
 * @returns {{ success, data: { board, columns: Column[] } }}
 */
const getBoardById = async (boardId) => {
  return request(`/api/boards/${boardId}`);
};

/**
 * Create a new board.
 * @param {string} name         - required
 * @param {string} description  - optional
 * @returns {{ success, data: Board }}
 */
const createBoard = async (name, description = "") => {
  return request("/api/boards", {
    method: "POST",
    body: JSON.stringify({ name, description }),
  });
};

/**
 * Delete a board and all its columns and cards.
 * @param {string} boardId
 * @returns {{ success, message }}
 */
const deleteBoard = async (boardId) => {
  return request(`/api/boards/${boardId}`, {
    method: "DELETE",
  });
};

// COLUMN FUNCTIONS

/**
 * Create a new column on a board.
 * @param {string} boardId
 * @param {string} title
 * @returns {{ success, data: Column }}
 */
const createColumn = async (boardId, title) => {
  return request(`/api/boards/${boardId}/columns`, {
    method: "POST",
    body: JSON.stringify({ title }),
  });
};

/**
 * Reorder all columns on a board.
 * @param {string} boardId
 * @param {{ _id: string, order: number }[]} columns
 * @returns {{ success, message }}
 */
const reorderColumns = async (boardId, columns) => {
  return request(`/api/boards/${boardId}/columns/reorder`, {
    method: "PATCH",
    body: JSON.stringify({ columns }),
  });
};

// Export all functions as named exports grouped in an object
const boardService = {
  getAllBoards,
  getBoardById,
  createBoard,
  deleteBoard,
  createColumn,
  reorderColumns,
};

export default boardService;
