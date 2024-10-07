import express from "express";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import cookieParser from "cookie-parser";
import {connectDataBase} from "./db/connectMongo.js";
import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import postRoutes from "./routes/postRoute.js";
import messageRoute from "./routes/messageRoute.js";
import notificationsRoute from "./routes/notificationsRoute.js";


dotenv.config();
connectDataBase();


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({extended: true }));
app.use(cookieParser());

app.get("/", (req,res) => {
    res.send("SERVER IS WORKING SUCCESSFULLY")
});

app.use("/api/auth", authRoute);
app.use("/api/user", userRoute);
app.use("/api/post", postRoutes);
app.use("/api/message", messageRoute);
app.use("/api/notifications", notificationsRoute);


app.listen(PORT, () => {
    console.log(`server is running on port: ${PORT}`);
});