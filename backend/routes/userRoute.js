import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";

import {
  followUnFollow,
  updateUser,
  deactivateAccount,
  deleteAccount,
  getUserProfile,
  getUserFollowers,
  getUserFollowing,
  searchUsers,
  suggestedUsers,
  getAllUsers,
  getFollowingUsers,
  removeDeletedUser
} from "../controllers/userController.js";

const route = express.Router();

route.post("/followunfollow/:id", protectRoute, followUnFollow);
route.post("/update", protectRoute, updateUser);

// ✅ NEW ACCOUNT ROUTES
route.post("/deactivate", protectRoute, deactivateAccount);
route.delete("/delete-account", protectRoute, deleteAccount);

route.get("/allusers", protectRoute, getAllUsers);
route.get("/followingusers", protectRoute, getFollowingUsers);
route.get("/followers/:id", protectRoute, getUserFollowers);
route.get("/following/:id", protectRoute, getUserFollowing);
route.get("/suggested", protectRoute, suggestedUsers);
route.get("/search", protectRoute, searchUsers);
route.get("/profile/:query", protectRoute, getUserProfile);
route.delete("/removedeletedusers", protectRoute, removeDeletedUser);

export default route;