import { Server } from "socket.io";
import http from "http";
import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const userSocketMap = {};

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  allowUpgrades: true,
});

export const getReceiverId = (receiverId) => {
  const key = String(receiverId).trim();
  return userSocketMap[key];
};

export const getUserSocketMap = () => ({ ...userSocketMap });

io.on("connection", (socket) => {
  let userId = socket.handshake.query.userId;
  if (Array.isArray(userId)) userId = userId[0];
  userId = String(userId || "").trim();

  if (userId && userId !== "undefined" && userId !== "null") {
    userSocketMap[userId] = socket.id;
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("typing", ({ senderId, receiverId }) => {
    const id = getReceiverId(receiverId);
    if (id) io.to(id).emit("typing", { senderId });
  });

  socket.on("stopTyping", ({ senderId, receiverId }) => {
    const id = getReceiverId(receiverId);
    if (id) io.to(id).emit("stopTyping", { senderId });
  });

  socket.on("disconnect", () => {
    if (userId) {
      delete userSocketMap[userId];
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

app.set("io", io);
export { io, server, app };