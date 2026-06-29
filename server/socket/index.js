const { Server } = require("socket.io");

/**
 * initSocket
 * Attaches Socket.io to the existing http.Server instance.
 * Also stores the io instance on the Express app so controllers
 * can emit events without importing this file (avoids circular deps).
 *
 * @param {http.Server} server  - The Node http server from server.js
 * @param {Express}     app     - The Express app from app.js
 */
const initSocket = (server, app) => {
  // CREATE SOCKET.IO SERVER
  const io = new Server(server, {
    cors: {
      // Allow connections from the React dev server.
      // In production, this would be your deployed frontend URL.
      // We read it from the environment variable set in server/.env
      origin: process.env.CLIENT_URL || "http://localhost:5173",

      // Allow standard HTTP methods on the initial handshake request.
      // Socket.io uses an HTTP upgrade request to establish the WebSocket.
      methods: ["GET", "POST"],
    },
  });

  // STORE io ON THE EXPRESS APP
  app.set("io", io);

  // CONNECTION HANDLER

  // io.on("connection") fires every time a new client connects.
  // "socket" represents that one specific client connection.
  // Each connected browser tab gets its own unique socket object.
  io.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // JOIN BOARD ROOM

    // The client emits "board:join" with a boardId when BoardPage mounts.
    // We call socket.join(boardId) to add this socket to that room.
    socket.on("board:join", (boardId) => {
      socket.join(boardId);
      console.log(`[Socket] ${socket.id} joined board room: ${boardId}`);
    });

    // LEAVE BOARD ROOM

    // The client emits "board:leave" when BoardPage unmounts
    // (user navigates away from the board).
    // socket.leave() removes this socket from the room.
    socket.on("board:leave", (boardId) => {
      socket.leave(boardId);
      console.log(`[Socket] ${socket.id} left board room: ${boardId}`);
    });

    // DISCONNECT HANDLER

    // Fires when the client closes the tab, loses internet, or
    // calls socket.disconnect() explicitly.
    // Socket.io automatically removes the socket from all rooms on disconnect.
    socket.on("disconnect", (reason) => {
      console.log(`[Socket] Client disconnected: ${socket.id} — ${reason}`);
    });
  });

  // Return io in case anything else needs it
  return io;
};

module.exports = initSocket;
