import express from "express";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { connectDataBase } from "./db/connectMongo.js";

import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import postRoutes from "./routes/postRoute.js";
import messageRoute from "./routes/messageRoute.js";
import notificationsRoute from "./routes/notificationsRoute.js";
import accountRoutes from "./routes/accountRoutes.js";

import { app, server } from "./socket/socket.js";

dotenv.config();
connectDataBase();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const PORT = process.env.PORT || 8080;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  app.set("trust proxy", 1);
}

app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: "Too many requests, please slow down" },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth", authLimiter, authRoute);
app.use("/api/user", generalLimiter, userRoute);
app.use("/api/post", generalLimiter, postRoutes);
app.use("/api/message", generalLimiter, messageRoute);
app.use("/api/notifications", generalLimiter, notificationsRoute);
app.use("/api/account", generalLimiter, accountRoutes);

// Serve frontend static files
// dist folder is placed directly in the backend folder before zipping
app.use(express.static(path.join(__dirname, "dist")));

// All non-API routes serve index.html for React Router
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT} in ${isProduction ? "production" : "development"} mode`);
});