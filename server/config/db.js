// Database Connection Module

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {});

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database Name   : ${conn.connection.name}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};
// MONGOOSE CONNECTION EVENT LISTENERS

// Fires when Mongoose loses connection to Atlas
mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected");
});

// Fires when Mongoose successfully reconnects
mongoose.connection.on("reconnected", () => {
  console.log("MongoDB reconnected");
});

// Fires on any connection error after initial connection
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err.message);
});

module.exports = connectDB;
