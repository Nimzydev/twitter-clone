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
  searchUsers,
  getUserFollowers,
  getUserFollowing
} from "../controllers/userController.js";

const route = express.Router();

route.post("/followunfollow/:id", protectRoute, followUnFollow);

route.get("/allusers", protectRoute, getAllUsers);

route.get("/followingusers", protectRoute, getFollowingUsers);

// ✅ NEW ROUTES
route.get("/followers/:id", protectRoute, getUserFollowers);
route.get("/following/:id", protectRoute, getUserFollowing);

route.get("/suggested", protectRoute, suggestedUsers);

route.get("/search", protectRoute, searchUsers);

route.post("/update", protectRoute, updateUser);

route.get("/profile/:query", protectRoute, getUserProfile);

route.delete("/removedeletedusers", protectRoute, removeDeletedUser);

export default route;