// All API calls related to cards live here.

const API_BASE = import.meta.env.VITE_API_URL || "";

// Same request helper pattern as boardService.
const request = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
};

// CARD FUNCTIONS
/**
 * Create a new card inside a column.
 * @param {string} boardId
 * @param {string} columnId
 * @param {string} title      - required
 * @param {object} extras     - optional: { description, priority, assignee, labels }
 * @returns {{ success, data: Card }}
 */
const createCard = async (boardId, columnId, title, extras = {}) => {
  return request(`/api/boards/${boardId}/cards`, {
    method: "POST",
    body: JSON.stringify({ columnId, title, ...extras }),
  });
};

/**
 * Update a card's fields.
 * Only send the fields you want to change — others are left untouched.
 * @param {string} cardId
 * @param {object} updates  - any of: { title, description, priority, assignee, labels }
 * @returns {{ success, data: Card }}
 */
const updateCard = async (cardId, updates) => {
  return request(`/api/cards/${cardId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
};

/**
 * Delete a card permanently.
 * @param {string} cardId
 * @returns {{ success, message }}
 */
const deleteCard = async (cardId) => {
  return request(`/api/cards/${cardId}`, {
    method: "DELETE",
  });
};

/**
 * Move a card to a different column (or reposition within the same column).
 * @param {string} cardId
 * @param {string} targetColumnId
 * @param {number} newOrder
 * @returns {{ success, data: Card }}
 */
const moveCard = async (cardId, targetColumnId, newOrder) => {
  return request(`/api/cards/${cardId}/move`, {
    method: "PATCH",
    body: JSON.stringify({ targetColumnId, newOrder }),
  });
};

const cardService = {
  createCard,
  updateCard,
  deleteCard,
  moveCard,
};

export default cardService;
