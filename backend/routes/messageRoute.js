import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { sendMessage, getMessages, getConversations, deleteConversation } from "../controllers/messageController.js";

const route = express.Router();

route.post("/send/:id", protectRoute, sendMessage);
route.get("/allmessages/:id", protectRoute, getMessages);
route.get("/getusers", protectRoute, getConversations);
route.delete("/delete/:id", protectRoute, deleteConversation);

export default route;