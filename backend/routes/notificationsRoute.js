import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { getNotifications, markNotificationsRead, deleteOneNotification, deleteAllNotifications } from "../controllers/notificationsController.js";


const route = express.Router();

route.get("/allnotifications", protectRoute, getNotifications);
route.put("/markread", protectRoute, markNotificationsRead);
route.delete("/delete/:id", protectRoute, deleteOneNotification);
route.delete("/deleteall", protectRoute, deleteAllNotifications);

export default route;