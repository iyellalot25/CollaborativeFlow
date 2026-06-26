// Health Check Route

const express = require("express");

const router = express.Router();

// GET /api/health
//confirms the server is running and responding
router.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "CollaborativeFlow AI server is running",
    timestamp: new Date().toISOString(), // ISO format: "2024-01-15T10:30:00.000Z"
    environment: process.env.NODE_ENV, // "development" or "production" from env
  });
});

// GET /api/health/ping
//show uptime
router.get("/ping", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "pong",
    uptime: process.uptime(),
  });
});

module.exports = router;
