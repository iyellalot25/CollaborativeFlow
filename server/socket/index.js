// server/socket/index.js
// Socket.io server configuration.
// Responsibilities:
//   1. Create the Socket.io server instance attached to the http server
//   2. Configure CORS so the React frontend can connect
//   3. Handle client connections and disconnections
//   4. Handle board room join/leave events
//
// This file does NOT handle card events directly.
// Card events are emitted from controllers (cardController, boardController)
// using io retrieved via req.app.get("io").
//
// WHY a separate file?
// server.js should only handle startup. Mixing socket logic there
// makes it harder to read, test, and maintain.

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
  // ─────────────────────────────────────────────────────────────
  // CREATE SOCKET.IO SERVER
  // ─────────────────────────────────────────────────────────────

  // new Server(httpServer, options) attaches Socket.io to our existing
  // HTTP server. From this point, the same port handles both:
  //   - Regular HTTP requests (Express routes)
  //   - WebSocket connections (Socket.io)
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

  // ─────────────────────────────────────────────────────────────
  // STORE io ON THE EXPRESS APP
  // ─────────────────────────────────────────────────────────────

  // WHY: Controllers (cardController.js, boardController.js) need to emit
  // socket events after database operations. But they don't import socket/index.js
  // (that would create a circular dependency: controller → socket → server → app → routes → controller).
  //
  // Solution: store io on app. Any controller can then do:
  //   const io = req.app.get("io");
  //   io.to(boardId).emit("card:created", card);
  //
  // req.app is Express's built-in reference to the app instance.
  // app.set / app.get is Express's key-value store — like a config bag.
  app.set("io", io);

  // ─────────────────────────────────────────────────────────────
  // CONNECTION HANDLER
  // ─────────────────────────────────────────────────────────────

  // io.on("connection") fires every time a new client connects.
  // "socket" represents that one specific client connection.
  // Each connected browser tab gets its own unique socket object.
  io.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // ───────────────────────────────────────────────────────────
    // JOIN BOARD ROOM
    // ───────────────────────────────────────────────────────────

    // The client emits "board:join" with a boardId when BoardPage mounts.
    // We call socket.join(boardId) to add this socket to that room.
    //
    // After joining, any message emitted to io.to(boardId) will be
    // received by this socket — along with all others in the same room.
    //
    // Rooms are just strings. Socket.io manages the membership list.
    // There is no limit to how many sockets can be in one room.
    socket.on("board:join", (boardId) => {
      socket.join(boardId);
      console.log(`[Socket] ${socket.id} joined board room: ${boardId}`);
    });

    // ───────────────────────────────────────────────────────────
    // LEAVE BOARD ROOM
    // ───────────────────────────────────────────────────────────

    // The client emits "board:leave" when BoardPage unmounts
    // (user navigates away from the board).
    //
    // socket.leave() removes this socket from the room.
    // Socket.io also automatically cleans up rooms on disconnect,
    // but explicit leaving is cleaner — good practice.
    socket.on("board:leave", (boardId) => {
      socket.leave(boardId);
      console.log(`[Socket] ${socket.id} left board room: ${boardId}`);
    });

    // ───────────────────────────────────────────────────────────
    // DISCONNECT HANDLER
    // ───────────────────────────────────────────────────────────

    // Fires when the client closes the tab, loses internet, or
    // calls socket.disconnect() explicitly.
    // Socket.io automatically removes the socket from all rooms on disconnect.
    socket.on("disconnect", (reason) => {
      console.log(`[Socket] Client disconnected: ${socket.id} — ${reason}`);
    });
  });

  // Return io in case anything else needs it (currently nothing does)
  return io;
};

module.exports = initSocket;
