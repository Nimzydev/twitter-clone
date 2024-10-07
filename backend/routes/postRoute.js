import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { createPost, likePost, deletePost, commentPost, deleteComment, getLikedPosts, retweetPost, getRetweetedPosts } from "../controllers/postController.js";

const route = express.Router();

route.post("/create", protectRoute, createPost);
route.post("/like/:id", protectRoute, likePost);
route.delete("/delete/:id", protectRoute, deletePost);
route.post("/comment/:id", protectRoute, commentPost);
route.delete("/delete/comment/:id", protectRoute, deleteComment);
route.get("/likedposts", protectRoute, getLikedPosts);
route.post("/retweet/:id", protectRoute, retweetPost);
route.get("/retweetedposts", protectRoute, getRetweetedPosts);

export default route;