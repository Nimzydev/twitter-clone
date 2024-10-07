import mongoose from "mongoose";

export const connectDataBase = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO)
        console.log(`MONGODB connected successfully: ${conn.connection.host}`);
        
    } catch (error) {
        console.log("Error in connecting database", error);
        
    }
}