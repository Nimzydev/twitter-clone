import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { followUnFollow, suggestedUsers, updateUser } from "../controllers/userController.js";

const route = express.Router();

route.post("/followunfollow/:id", protectRoute, followUnFollow);
route.get("/suggested", protectRoute, suggestedUsers);
route.post("/update", protectRoute, updateUser);

export default route;
