const express = require("express");
const cors = require("cors");

require("dotenv").config();

// Create the Express application instance
const app = express();

// CORS Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL, // Only allow requests from our frontend URL
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // Allowed HTTP methods
    credentials: true, // Allow cookies to be sent
  }),
);

// JSON Body Parser Middleware
app.use(express.json());

// URL Encoded Body Parser
app.use(express.urlencoded({ extended: false }));

// ROUTES
const healthRoutes = require("./routes/healthRoutes");
const boardRoutes = require("./routes/boardRoutes");
const cardRoutes = require("./routes/cardRoutes");

app.use("/api/health", healthRoutes);

// Board routes: GET/POST /api/boards, GET/DELETE /api/boards/:boardId
// Column routes: POST /api/boards/:boardId/columns (nested under boards)
app.use("/api/boards", boardRoutes);

// Card routes: PATCH/DELETE /api/cards/:cardId, PATCH /api/cards/:cardId/move
app.use("/api/cards", cardRoutes);

// CARD CREATION — nested under boards
// POST /api/boards/:boardId/cards → cardController.createCard
const { createCard } = require("./controllers/cardController");
app.post("/api/boards/:boardId/cards", createCard);

// 404 HANDLER
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.method} ${req.url} not found`,
  });
});

// GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(500).json({
    status: "error",
    message: "Internal server error",
    // Only show error details in development NOY in production
    ...(process.env.NODE_ENV === "development" && { error: err.message }),
  });
});

module.exports = app;
