import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const userSocketMap = {};
const userActivityMap = {}; // ✅ last seen tracking

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

export const getReceiverId = (receiverId) => {
  return userSocketMap[receiverId];
};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;

  if (userId) {
    userSocketMap[userId] = socket.id;

    // ✅ last active = now
    userActivityMap[userId] = Date.now();
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // =========================
  // ✍️ TYPING EVENTS
  // =========================

  socket.on("sendMessage", ({ senderId, receiverId, message }) => {
  const receiverSocketId = userSocketMap[receiverId];

  if (receiverSocketId) {
    io.to(receiverSocketId).emit("newMessage", {
      senderId,
      message,
    });
  }
});

  socket.on("typing", ({ senderId, receiverId }) => {
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing", { senderId });
    }
  });

  socket.on("stopTyping", ({ senderId, receiverId }) => {
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("stopTyping", { senderId });
    }
  });

  // =========================
  // DISCONNECT
  // =========================

  socket.on("disconnect", () => {
    if (userId) {
      delete userSocketMap[userId];
      userActivityMap[userId] = Date.now(); // last seen update
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, server, app };