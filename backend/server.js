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

// AWS Elastic Beanstalk uses port 8080 by default
// Falls back to 5000 for local development
const PORT = process.env.PORT || 8080;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const isProduction = process.env.NODE_ENV === "production";

// Trust the load balancer proxy on AWS
// This is required for rate limiting and secure cookies to work correctly
// behind AWS Elastic Beanstalk's load balancer
if (isProduction) {
  app.set("trust proxy", 1);
}

// Security headers
// crossOriginEmbedderPolicy disabled because Cloudinary images would be blocked
// contentSecurityPolicy disabled to avoid blocking Socket.IO and Cloudinary
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS — allows requests from your frontend URL
// In production this should be your real frontend domain
app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));

// Rate limiting for auth routes
// 20 login/signup attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limit
// 200 requests per 15 minutes per IP
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

// Serve frontend static files in production
// The frontend build output (dist folder) sits alongside the backend
// This is the standard pattern for full-stack deployment on Elastic Beanstalk
if (isProduction) {
  const frontendDistPath = path.join(__dirname, "../frontend/dist");

  // Serve static assets (JS, CSS, images)
  app.use(express.static(frontendDistPath));

  // For any route that is not an API route, serve index.html
  // This allows React Router to handle client-side routing
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${isProduction ? "production" : "development"} mode`);
});