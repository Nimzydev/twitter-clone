import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const userSocketMap = {};

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  allowUpgrades: true,
});

export const getReceiverId = (receiverId) => {
  const key = String(receiverId).trim();
  const result = userSocketMap[key];
  console.log(`   getReceiverId("${key}") => ${result || "undefined"}`);
  return result;
};

// Export so controllers can log the full map for debugging
export const getUserSocketMap = () => ({ ...userSocketMap });

io.on("connection", (socket) => {
  let userId = socket.handshake.query.userId;
  if (Array.isArray(userId)) userId = userId[0];
  userId = String(userId || "").trim();

  if (userId && userId !== "undefined" && userId !== "null") {
    userSocketMap[userId] = socket.id;
    console.log(`\n🟢 [SOCKET] Connected: userId=${userId} socketId=${socket.id}`);
    console.log(`   Active map:`, userSocketMap);
  } else {
    console.warn("⚠️ [SOCKET] Connection with invalid userId rejected");
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

  socket.on("disconnect", (reason) => {
    if (userId) {
      delete userSocketMap[userId];
      console.log(`\n🔴 [SOCKET] Disconnected: userId=${userId} reason=${reason}`);
      console.log(`   Active map:`, userSocketMap);
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

app.set("io", io);
export { io, server, app };