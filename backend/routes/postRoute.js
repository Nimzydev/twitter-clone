import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";

import {
  createPost,
  likePost,
  deletePost,
  commentPost,
  deleteComment,
  getLikedPosts,
  retweetPost,
  getRetweetedPosts,
  getFollowingPosts,
  getOwnPosts,
  getHomePosts,
  getPostLikers,
  getPostRetweeters,
} from "../controllers/postController.js";

const route = express.Router();

route.post("/create", protectRoute, createPost);
route.post("/like/:id", protectRoute, likePost);
route.delete("/delete/:id", protectRoute, deletePost);
route.post("/comment/:id", protectRoute, commentPost);
route.delete("/delete/comment/:postId/:commentId", protectRoute, deleteComment);
route.get("/likedposts/:id", protectRoute, getLikedPosts);
route.post("/retweet/:id", protectRoute, retweetPost);
route.get("/retweetedposts/:id", protectRoute, getRetweetedPosts);
route.get("/homeposts", protectRoute, getHomePosts);
route.get("/followingposts", protectRoute, getFollowingPosts);
route.get("/ownposts/:username", protectRoute, getOwnPosts);

// New routes for viewing likers and retweeters
route.get("/likers/:id", protectRoute, getPostLikers);
route.get("/retweeters/:id", protectRoute, getPostRetweeters);

export default route;