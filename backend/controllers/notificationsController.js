import Notifications from "../models/notificationsModel.js";
import User from "../models/userModel.js";

export const getNotifications = async (req,res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({error: "no user found!"});
        }

        const allNotifications = await Notifications.find({receiver: userId}).populate({
            path: "from",
            select: "fullName username email profilePic"
        }).populate({
            path: "refPost", 
            select: "text"
        }).populate({
            path: "receiver",
            select: "profilePic",
        })

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

        const notification = await Notifications.findById(notificationId); 

        if (!notification) {
            return res.status(400).json({error: "no notification found!"});
        }

        if (notification.receiver.toString() !== userId.toString()) {
            return res.status(403).json({ error: "not authorized" });
        }

        await Notifications.findByIdAndDelete(notificationId);

        return res.status(200).json({
            success: true,
            message: "Notification deleted"
        });

    } catch (error) {
        console.log("Error in DeleteOneNotifications controller", error);
        return res.status(500).json({error: "Internal server error!"}); 
    }
};



export const deleteAllNotifications = async (req,res) => {
    try {
        const userId = req.user._id;

        await Notifications.deleteMany({receiver:userId});

        return res.status(200).json({
            success: true,
            message: "All notifications deleted"
        });

    } catch (error) {
        console.log("Error in DeleteAllNotifications controller", error);
        return res.status(500).json({error: "Internal server error!"}); 
    }
};




export const markNotificationsRead = async (req, res) => {
    try {
        const userId = req.user._id;

        await Notifications.updateMany(
            { receiver: userId, read: false },
            { $set: { read: true } }
        );

        return res.status(200).json({ message: "Notifications marked as read" });
    } catch (error) {
        console.log("Error marking notifications read", error);
        return res.status(500).json({ error: "Internal server error!" });
    }
};

