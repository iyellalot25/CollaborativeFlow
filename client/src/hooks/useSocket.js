// Custom React hook that manages a Socket.io connection for a single board.
//
// Responsibilities:
//   1. Connect to the server when the component mounts
//   2. Emit "board:join" to enter the board's room
//   3. Return the socket instance so the caller can register event listeners
//   4. Emit "board:leave" and disconnect when the component unmounts

import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

/**
 * useSocket
 * Connects to the Socket.io server, joins a board room, and returns
 * the socket instance for the caller to attach event listeners.
 *
 * @param {string} boardId - The MongoDB _id of the board to join
 * @returns {object} socket - The Socket.io client socket instance
 */
const useSocket = (boardId) => {
  const socketRef = useRef(null);

  useEffect(() => {
    // CONNECT TO SERVER
    const socket = io(import.meta.env.VITE_SOCKET_URL, {
      // transports: ["websocket"] skips the HTTP polling fallback.
      transports: ["websocket"],
    });

    // Store in ref so BoardPage can access it via socketRef.current
    socketRef.current = socket;

    // JOIN THE BOARD ROOM

    // We emit "board:join" once the connection is established.
    // "connect" fires when the handshake with the server completes.
    socket.on("connect", () => {
      console.log("[Socket] Connected:", socket.id);
      // Tell the server which board room we want to join.
      socket.emit("board:join", boardId);
    });

    // CLEANUP — runs when the component unmounts

    return () => {
      if (socket) {
        socket.emit("board:leave", boardId);
        socket.disconnect();
        console.log("[Socket] Disconnected from board:", boardId);
      }
    };
  }, [boardId]);

  // Return the ref's current value — the socket instance.
  return socketRef.current;
};

export default useSocket;
