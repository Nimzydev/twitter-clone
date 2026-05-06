import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { 
  followUnFollow, 
  suggestedUsers, 
  updateUser, 
  getUserProfile, 
  removeDeletedUser, 
  getAllUsers, 
  getFollowingUsers,
  searchUsers
} from "../controllers/userController.js";

const route = express.Router();

route.post("/followunfollow/:id", protectRoute, followUnFollow);
route.get("/allusers", protectRoute, getAllUsers);
route.get("/followingusers", protectRoute, getFollowingUsers);
route.get("/suggested", protectRoute, suggestedUsers);
route.get("/search", protectRoute, searchUsers); // ✅ ADDED
route.post("/update", protectRoute, updateUser);
route.get("/profile/:query", protectRoute, getUserProfile);
route.delete("/removedeletedusers", protectRoute, removeDeletedUser);

export default route;