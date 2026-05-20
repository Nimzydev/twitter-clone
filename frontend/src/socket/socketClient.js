import { io } from "socket.io-client";

// In production, the frontend is served by the backend on the same domain
// so we connect to the current window origin instead of a hardcoded URL.
// In development, we connect to localhost:5000.
const getServerUrl = () => {
  // If running in a browser in production, connect to same origin
  if (typeof window !== "undefined" &&
      window.location.hostname !== "localhost") {
    return window.location.origin;
  }
  // Development fallback
  return import.meta.env.VITE_API_URL || "http://localhost:5000";
};

const SERVER_URL = getServerUrl();

let socket = null;
let myUserId = null;
let isConnecting = false;

const listeners = {
  onlineUsers: new Set(),
  newMessage: new Set(),
  newNotification: new Set(),
  typing: new Set(),
  stopTyping: new Set(),
};

export const getSocket = () => socket;
export const getMyUserId = () => myUserId;

export const connectSocket = (userId) => {
  const uid = String(userId).trim();

  if (socket?.connected && myUserId === uid) {
    return socket;
  }

  if (isConnecting) {
    return socket;
  }

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  isConnecting = true;
  myUserId = uid;

  socket = io(SERVER_URL, {
    query: { userId: uid },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    withCredentials: true,
  });

  socket.on("connect", () => {
    isConnecting = false;
  });

  socket.on("disconnect", () => {
    isConnecting = false;
  });

  socket.on("getOnlineUsers", (users) => {
    listeners.onlineUsers.forEach((cb) => cb(users));
  });

  socket.on("newMessage", (msg) => {
    listeners.newMessage.forEach((cb) => cb(msg));
  });

  socket.on("newNotification", (data) => {
    listeners.newNotification.forEach((cb) => cb(data));
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