import express from "express";
import { getMe, signUp, login, logout } from "../controllers/authController.js";
import { protectRoute } from "../middleware/protectRoute.js";

const route = express.Router(); 

route.get("/me", protectRoute, getMe);
route.post("/signup", signUp);
route.post("/login", login);
route.post("/logout", logout);


export default route;