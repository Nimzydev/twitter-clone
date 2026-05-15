import { io } from "socket.io-client";

let socket = null;
let myUserId = null;
let isConnecting = false;

const listeners = {
  onlineUsers: new Set(),
  newMessage: new Set(),
  typing: new Set(),
  stopTyping: new Set(),
};

export const getSocket = () => socket;
export const getMyUserId = () => myUserId;

export const connectSocket = (userId) => {
  const uid = String(userId).trim();

  if (socket?.connected && myUserId === uid) {
    console.log(`[SOCKET] Already connected as ${uid}`);
    return socket;
  }

  if (isConnecting) {
    console.log(`[SOCKET] Already connecting...`);
    return socket;
  }

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  isConnecting = true;
  myUserId = uid;

  console.log(`🚀 [SOCKET] Connecting as: ${uid}`);

  socket = io("http://localhost:5000", {
    query: { userId: uid },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    isConnecting = false;
    console.log(`✅ [SOCKET] Connected: ${socket.id}`);
  });

  socket.on("disconnect", (reason) => {
    console.log(`🔌 [SOCKET] Disconnected: ${reason}`);
    isConnecting = false;
  });

  socket.on("getOnlineUsers", (users) => {
    listeners.onlineUsers.forEach((cb) => cb(users));
  });

  socket.on("newMessage", (msg) => {
    console.log(`\n📨 [SOCKET SINGLETON] newMessage:`, JSON.stringify(msg));
    listeners.newMessage.forEach((cb) => cb(msg));
  });

  socket.on("typing", (data) => {
    listeners.typing.forEach((cb) => cb(data));
  });

  socket.on("stopTyping", (data) => {
    listeners.stopTyping.forEach((cb) => cb(data));
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    myUserId = null;
    isConnecting = false;
  }
};

export const addSocketListener = (event, cb) => {
  if (listeners[event]) {
    listeners[event].add(cb);
  }
};

export const removeSocketListener = (event, cb) => {
  if (listeners[event]) {
    listeners[event].delete(cb);
  }
};