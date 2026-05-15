import Message from "../models/messageModel.js";
import Conversation from "../models/conversationModel.js";
import { v2 as cloudinary } from "cloudinary";
import { getReceiverId, io, getUserSocketMap } from "../socket/socket.js";

export const sendMessage = async (req, res) => {
  try {
    const { id: receiverIdParam } = req.params;
    const senderId = req.user._id;
    const { text } = req.body;
    const file = req.file;

    const receiverId = String(receiverIdParam).trim();
    const senderIdStr = String(senderId).trim();

    console.log(`\n📤 ===== SEND MESSAGE =====`);
    console.log(`   Sender:   ${senderIdStr}`);
    console.log(`   Receiver: ${receiverId}`);

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
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    const newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      text: text || "",
      image: imageUrl,
      video: videoUrl,
      audio: audioUrl,
    });

    conversation.messages.push(newMessage._id);
    await Promise.all([conversation.save(), newMessage.save()]);

    // Plain string payload — no Mongoose ObjectIds
    const payload = {
      _id: String(newMessage._id),
      sender: senderIdStr,
      receiver: receiverId,
      text: newMessage.text,
      image: newMessage.image,
      video: newMessage.video,
      audio: newMessage.audio,
      read: newMessage.read,
      createdAt: newMessage.createdAt,
      updatedAt: newMessage.updatedAt,
    };

    // Log the full socket map so we can see who is online
    const socketMap = getUserSocketMap();
    console.log(`   Socket map:`, socketMap);

    const receiverSocketId = getReceiverId(receiverId);
    console.log(`   Receiver socket ID: ${receiverSocketId || "NOT FOUND — receiver offline"}`);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", payload);
      console.log(`   ✅ Emitted newMessage to receiver socket: ${receiverSocketId}`);
    } else {
      console.warn(`   ⚠️  Receiver NOT in socket map. Message saved to DB only.`);
    }

    console.log(`   Payload:`, payload);
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

export const markMessagesAsRead = async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    await Message.updateMany(
      { sender: receiverId, receiver: senderId, read: false },
      { $set: { read: true } }
    );

    res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    console.log("Error in markMessagesAsRead controller", error);
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