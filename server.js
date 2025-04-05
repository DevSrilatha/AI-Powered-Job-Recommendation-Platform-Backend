const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Message = require("./models/Message");
const chatRoutes = require("./routes/chatRoutes");
const authRoutes = require("./routes/authRoutes");
const jobRoutes = require("./routes/jobRoutes");
const userRoutes = require("./routes/userRoutes");
const applicationRoutes = require("./routes/applicationRoutes");

dotenv.config();
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/chat", chatRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/job", jobRoutes);
app.use("/api/user", userRoutes);
app.use("/api/application", applicationRoutes);

// Health Check Route
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: Date.now() });
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error(" MongoDB Connection Error:", err));

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: ['https://client-miq4j6agv-nama-srilathas-projects.vercel.app'],
    methods: ['GET', 'POST'],
  },
});

// Store online users
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log(` Socket connected: ${socket.id}`);

  // Register user
  socket.on("registerUser", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(` User registered: ${userId} (socket: ${socket.id})`);
  });

  // Send message
  socket.on("sendMessage", async ({ senderId, receiverId, message }) => {
    try {
      if (!senderId || !receiverId || !message.trim()) return;

      const newMessage = new Message({ senderId, receiverId, message });
      await newMessage.save();

      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        socket.to(receiverSocketId).emit("receiveMessage", newMessage);
      }

      // Emit back to sender only if receiver is different
      if (socket.id !== receiverSocketId) {
        socket.emit("receiveMessage", newMessage);
      }

    } catch (error) {
      console.error(" Error sending message:", error);
    }
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
    for (let [userId, socketId] of onlineUsers) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`⚠️ User disconnected: ${userId}`);
        break;
      }
    }
  });
});

// Graceful Shutdown
process.on("SIGINT", () => {
  server.close(() => {
    console.log("🔌 Server closed");
    process.exit(0);
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(` Server running on port ${PORT}`));
