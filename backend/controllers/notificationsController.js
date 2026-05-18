import Notifications from "../models/notificationsModel.js";
import User from "../models/userModel.js";
import { getReceiverId, io } from "../socket/socket.js";

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "no user found!" });
    }

    const allNotifications = await Notifications.find({
      receiver: userId,
    })
      .populate({
        path: "from",
        select: "fullName username email profilePic",
      })
      .populate({
        path: "refPost",
        select: "text",
      })
      .populate({
        path: "receiver",
        select: "profilePic",
      });

    return res.status(200).json(allNotifications);
  } catch (error) {
    console.log("Error in GetNotifications controller", error);
    return res.status(500).json({ error: "Internal server error!" });
  }
};

export const deleteOneNotification = async (req, res) => {
  try {
    const { id: notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notifications.findById(notificationId);

    if (!notification) {
      return res.status(400).json({ error: "no notification found!" });
    }

    if (notification.receiver.toString() !== userId.toString()) {
      return res.status(403).json({ error: "not authorized" });
    }

    await Notifications.findByIdAndDelete(notificationId);

    return res.status(200).json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.log("Error in DeleteOneNotifications controller", error);
    return res.status(500).json({ error: "Internal server error!" });
  }
};

export const deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notifications.deleteMany({ receiver: userId });

    return res.status(200).json({
      success: true,
      message: "All notifications deleted",
    });
  } catch (error) {
    console.log("Error in DeleteAllNotifications controller", error);
    return res.status(500).json({ error: "Internal server error!" });
  }
};

export const markNotificationsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notifications.updateMany(
      { receiver: userId, read: false },
      { $set: { read: true } }
    );

    return res
      .status(200)
      .json({ message: "Notifications marked as read" });
  } catch (error) {
    console.log("Error marking notifications read", error);
    return res.status(500).json({ error: "Internal server error!" });
  }
};

// Helper called by other controllers (like, comment, follow, retweet)
// to create a notification AND emit it in real time via socket
export const createNotification = async ({
  from,
  receiver,
  type,
  message,
  refPost = null,
  refComment = null,
}) => {
  try {
    const notification = await Notifications.create({
      from,
      receiver,
      type,
      message,
      refPost,
      refComment,
    });

    // Emit real-time notification to receiver if online
    const receiverSocketId = getReceiverId(String(receiver));
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newNotification", {
        _id: String(notification._id),
        from: String(from),
        receiver: String(receiver),
        type,
        message,
        refPost,
        refComment,
        read: false,
        createdAt: notification.createdAt,
      });
    }

    return notification;
  } catch (error) {
    console.log("Error creating notification:", error);
    return null;
  }
};