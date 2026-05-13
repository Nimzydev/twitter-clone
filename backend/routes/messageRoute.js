import express from "express";

import {
  sendMessage,
  getMessages,
  getConversations,
  markMessagesAsRead,
  deleteConversation,
  deleteMessage,
} from "../controllers/messageController.js";

import { protectRoute } from "../middleware/protectRoute.js";

import upload from "../middleware/uploadMiddleware.js";

const route = express.Router();

route.get(
  "/allmessages/:id",
  protectRoute,
  getMessages
);

route.get(
  "/getusers",
  protectRoute,
  getConversations
);

route.put(
  "/markread/:id",
  protectRoute,
  markMessagesAsRead
);

route.post(
  "/send/:id",
  protectRoute,
  upload.single("file"),
  sendMessage
);

route.delete(
  "/deletemessage/:messageId",
  protectRoute,
  deleteMessage
);

route.delete(
  "/delete/:id",
  protectRoute,
  deleteConversation
);

export default route;