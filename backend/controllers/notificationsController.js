import Notifications from "../models/notificationsModel.js";
import User from "../models/userModel.js";

export const getNotifications = async (req,res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({error: "no user found!"});
        }

        const allNotifications = await Notifications.findOne({receiver: userId});

        return res.status(200).json(allNotifications);
        
    } catch (error) {
        console.log("Error in GetNotifications controller", error);
        return res.status(500).json({error: "Internal server error!"}); 
    }
}

export const deleteOneNotification = async (req,res) => {
    try {
        const {id:notificationId} = req.params;
        const userId = req.user._id;
        const user = await User.findById(userId);
        const notification = await Notifications.findById(notificationId); 

        if (!user) {
            return res.status(404).json({error: "no user found!"});
        }

        if (!notification) {
            return res.status(400).json({error: "no notification found!"});
        }

        await Notifications.findByIdAndDelete(notificationId);
        
    } catch (error) {
        console.log("Error in DeleteOneNotifications controller", error);
        return res.status(500).json({error: "Internal server error!"}); 
    }
}

export const deleteAllNotifications = async (req,res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({error: "user not found!"});
        }

        await Notifications.deleteMany({receiver:userId});
        
    } catch (error) {
        console.log("Error in DeleteAllNotifications controller", error);
        return res.status(500).json({error: "Internal server error!"}); 
    }
}

