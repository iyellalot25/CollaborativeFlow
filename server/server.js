require("dotenv").config();

const http = require("http"); // Nodes built-in HTTP module
const app = require("./app"); // configured Express application

// Read the port from environment variables
// If PORT is not set fallback to 5000 as default
const PORT = process.env.PORT || 5000;

// CREATE HTTP SERVER
const server = http.createServer(app);

// START LISTENING
server.listen(PORT, () => {
  console.log(`  CollaborativeFlow AI Server`);
  console.log(`  Environment : ${process.env.NODE_ENV}`);
  console.log(`  Port        : ${PORT}`);
  console.log(`  Status      : Running`);
});

// SHUTDOWN HANDLER
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});

// Export server so Socket.io can attach
module.exports = server;
