import express from "express";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import { connectDataBase } from "./db/connectMongo.js";

import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import postRoutes from "./routes/postRoute.js";
import messageRoute from "./routes/messageRoute.js";
import notificationsRoute from "./routes/notificationsRoute.js";
import accountRoutes from "./routes/accountRoutes.js"; // 🔥 NEW

import { app, server } from "./socket/socket.js";

dotenv.config();
connectDataBase();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const PORT = process.env.PORT || 5000;

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use("/api/auth", authRoute);
app.use("/api/user", userRoute);
app.use("/api/post", postRoutes);
app.use("/api/message", messageRoute);
app.use("/api/notifications", notificationsRoute);

// 🔥 NEW ROUTE
app.use("/api/account", accountRoutes);

server.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
});