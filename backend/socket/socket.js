import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const userSocketMap = {};
const userActivityMap = {};

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
    userActivityMap[userId] = Date.now();
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("sendMessage", ({ senderId, receiverId, message }) => {
    const receiverSocketId = userSocketMap[receiverId];

    const payload = {
      _id: message._id,
      sender: senderId,
      receiver: receiverId,
      text: message.text,
      image: message.image || "",
      video: message.video || "",
      audio: message.audio || "",
      createdAt: message.createdAt,
    };

    // ✅ ONLY SEND TO RECEIVER
    // DO NOT ECHO BACK TO SENDER
    // sender already updates local UI instantly
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", payload);
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

  socket.on("disconnect", () => {
    if (userId) {
      delete userSocketMap[userId];
      userActivityMap[userId] = Date.now();
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

app.set("io", io);

export { io, server, app };