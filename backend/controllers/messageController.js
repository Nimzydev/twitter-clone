import Message from "../models/messageModel.js";
import Conversation from "../models/conversationModel.js";
import { v2 as cloudinary } from "cloudinary";
import { getReceiverId, io, getUserSocketMap } from "../socket/socket.js";
import mongoose from "mongoose";

export const sendMessage = async (req, res) => {
  try {
    const { id: receiverIdParam } = req.params;
    const senderId = req.user._id;
    const { text } = req.body;
    const file = req.file;

    const receiverObjectId = new mongoose.Types.ObjectId(receiverIdParam);
    const senderIdStr = String(senderId).trim();
    const receiverIdStr = String(receiverIdParam).trim();

    console.log(`\n📤 ===== SEND MESSAGE =====`);
    console.log(`   Sender:   ${senderIdStr}`);
    console.log(`   Receiver: ${receiverIdStr}`);

    let imageUrl = "", videoUrl = "", audioUrl = "";

    if (file) {
      const base64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
      const cloudRes = await cloudinary.uploader.upload(base64, {
        folder: "chat-files",
      });
      if (file.mimetype.startsWith("image")) imageUrl = cloudRes.secure_url;
      else if (file.mimetype.startsWith("video")) videoUrl = cloudRes.secure_url;
      else if (file.mimetype.startsWith("audio")) audioUrl = cloudRes.secure_url;
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverObjectId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverObjectId],
      });
    }

    const newMessage = new Message({
      sender: senderId,
      receiver: receiverObjectId,
      text: text || "",
      image: imageUrl,
      video: videoUrl,
      audio: audioUrl,
    });

    conversation.messages.push(newMessage._id);
    await Promise.all([conversation.save(), newMessage.save()]);

    const payload = {
      _id: String(newMessage._id),
      sender: senderIdStr,
      receiver: receiverIdStr,
      text: newMessage.text,
      image: newMessage.image,
      video: newMessage.video,
      audio: newMessage.audio,
      read: newMessage.read,
      createdAt: newMessage.createdAt,
      updatedAt: newMessage.updatedAt,
    };

    const socketMap = getUserSocketMap();
    console.log(`   Socket map:`, socketMap);

    const receiverSocketId = getReceiverId(receiverIdStr);
    console.log(`   Receiver socket ID: ${receiverSocketId || "OFFLINE"}`);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", payload);
      console.log(`   ✅ Emitted to receiver`);
    }

    console.log(`===========================\n`);
    res.status(201).json(payload);
  } catch (error) {
    console.log("❌ sendMessage error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const senderId = req.user._id;

    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, userToChatId] },
    }).populate("messages");

    if (!conversation) return res.status(200).json([]);

    res.status(200).json(conversation.messages);
  } catch (error) {
    console.log("Error in getMessages controller", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId,
    }).populate("participants", "fullName username profilePic");

    const chatUsers = [];

    for (const conv of conversations) {
      const otherUser = conv.participants.find(
        (p) => p._id.toString() !== userId.toString()
      );

      if (!otherUser) continue;

      const lastMessage = await Message.findOne({
        $or: [
          { sender: userId, receiver: otherUser._id },
          { sender: otherUser._id, receiver: userId },
        ],
      })
        .sort({ createdAt: -1 })
        .select("text createdAt image video audio");

      chatUsers.push({
        _id: otherUser._id,
        fullName: otherUser.fullName,
        username: otherUser.username,
        profilePic: otherUser.profilePic,
        lastMessage: lastMessage
          ? {
              text: lastMessage.text,
              image: lastMessage.image,
              video: lastMessage.video,
              audio: lastMessage.audio,
              createdAt: lastMessage.createdAt,
            }
          : null,
      });
    }

    res.status(200).json(chatUsers);
  } catch (error) {
    console.log("Error in getConversations controller", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Returns unread counts per sender using $toString to handle
// both ObjectId and string storage formats in DB
export const getUnreadCounts = async (req, res) => {
  try {
    const userId = req.user._id;
    const userIdStr = String(userId);

    console.log(`📊 getUnreadCounts for: ${userIdStr}`);

    const unreadMessages = await Message.aggregate([
      {
        $match: {
          $expr: {
            $eq: [{ $toString: "$receiver" }, userIdStr],
          },
          read: false,
        },
      },
      {
        $group: {
          _id: { $toString: "$sender" },
          count: { $sum: 1 },
        },
      },
    ]);

    const counts = {};
    unreadMessages.forEach((item) => {
      counts[item._id] = item.count;
    });

    console.log(`📊 Unread counts result:`, counts);
    res.status(200).json(counts);
  } catch (error) {
    console.log("Error in getUnreadCounts controller", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Marks messages from a specific sender as read
export const markMessagesAsRead = async (req, res) => {
  try {
    const { id: senderIdParam } = req.params;
    const receiverId = req.user._id;
    const receiverIdStr = String(receiverId);
    const senderIdStr = String(senderIdParam);

    console.log(`✅ markMessagesAsRead: sender=${senderIdStr} receiver=${receiverIdStr}`);

    const result = await Message.updateMany(
      {
        $expr: {
          $and: [
            { $eq: [{ $toString: "$sender" }, senderIdStr] },
            { $eq: [{ $toString: "$receiver" }, receiverIdStr] },
          ],
        },
        read: false,
      },
      { $set: { read: true } }
    );

    console.log(`✅ Marked ${result.modifiedCount} messages as read`);
    res.status(200).json({
      message: "Messages marked as read",
      count: result.modifiedCount,
    });
  } catch (error) {
    console.log("Error in markMessagesAsRead controller", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Marks ALL unread messages for a user as read
// Called when user visits the messages page to clear stale counts
// from users no longer in their following list
export const markAllMessagesAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const userIdStr = String(userId);

    const result = await Message.updateMany(
      {
        $expr: {
          $eq: [{ $toString: "$receiver" }, userIdStr],
        },
        read: false,
      },
      { $set: { read: true } }
    );

    console.log(`✅ markAllMessagesAsRead: marked ${result.modifiedCount} as read for ${userIdStr}`);
    res.status(200).json({
      message: "All messages marked as read",
      count: result.modifiedCount,
    });
  } catch (error) {
    console.log("Error in markAllMessagesAsRead controller", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    await Conversation.findByIdAndDelete(conversationId);
    res.status(200).json({ message: "Conversation deleted" });
  } catch (error) {
    console.log("Error in deleteConversation controller", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    await Message.findByIdAndDelete(messageId);
    res.status(200).json({ message: "Message deleted" });
  } catch (error) {
    console.log("Error in deleteMessage controller", error);
    res.status(500).json({ error: "Internal server error" });
  }
};