import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { getNotifications, deleteOneNotification, deleteAllNotifications } from "../controllers/notificationsController.js";


const route = express.Router();

route.get("/", protectRoute, getNotifications);
route.delete("/delete", protectRoute, deleteOneNotification);
route.delete("/deleteall", protectRoute, deleteAllNotifications);

export default route;