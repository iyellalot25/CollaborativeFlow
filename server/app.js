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
app.use("/api/health", healthRoutes);

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
