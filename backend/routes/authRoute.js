import express from "express";
import {
  getMe,
  signUp,
  login,
  logout,
  googleLogin,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { protectRoute } from "../middleware/protectRoute.js";

const route = express.Router();

route.get("/me", protectRoute, getMe);
route.post("/signup", signUp);
route.post("/login", login);
route.post("/logout", logout);
route.post("/google", googleLogin);
route.post("/forgot-password", forgotPassword);
route.post("/reset-password/:token", resetPassword);

export default route;