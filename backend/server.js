import express from "express";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import path from "path"
import cors from "cors"
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import {connectDataBase} from "./db/connectMongo.js";
import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import postRoutes from "./routes/postRoute.js";
import messageRoute from "./routes/messageRoute.js";
import notificationsRoute from "./routes/notificationsRoute.js";
import { app, server } from "./socket/socket.js"; 
import fs from "fs";


dotenv.config();
connectDataBase();


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({limit:"5mb"}));
app.use(express.urlencoded({extended: true }));
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


app.use(express.static(path.join(__dirname, 'dist')));

app.use((req,res) =>{
    const indexPath = path.join(__dirname, 'dist');
    if(fs.existsSync(indexPath)){
        res.sendFile(path.join(__dirname, 'dist', 'index.html'))
    } else{
        res.status(404).send('index.html is not found')
    }
    })

server.listen(PORT, () => {
    console.log(`server is running on port: ${PORT}`);
});