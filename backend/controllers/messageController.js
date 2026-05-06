import Message from "../models/messageModel.js";
import Conversation from "../models/conversationModel.js";
import User from "../models/userModel.js";
import { getReceiverId, io } from "../socket/socket.js";

// ✅ SEND MESSAGE
export const sendMessage = async (req, res) => {
  try {
    const { text } = req.body; // ✅ must be "text"
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender) {
      return res.status(404).json({ error: "Sender not found!" });
    }

    if (!receiver) {
      return res.status(404).json({ error: "Receiver not found!" });
    }

    // ✅ find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    // ✅ create message
    const newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      text: text,
    });

    if (newMessage) {
      conversation.messages.push(newMessage._id);
    }

    await Promise.all([conversation.save(), newMessage.save()]);

    // ✅ SOCKET REAL-TIME
    const receiverSocketId = getReceiverId(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", {
        _id: newMessage._id,
        sender: newMessage.sender,
        receiver: newMessage.receiver,
        text: newMessage.text,
        createdAt: newMessage.createdAt,
      });
    }

    // ✅ CLEAN RESPONSE (IMPORTANT FIX)
    return res.status(200).json({
      _id: newMessage._id,
      sender: newMessage.sender,
      receiver: newMessage.receiver,
      text: newMessage.text,
      createdAt: newMessage.createdAt,
    });

  } catch (error) {
    console.log("Error in SendMessage controller", error);
    return res.status(500).json({ error: "Internal server error!" });
  }
};


// ✅ GET MESSAGES
export const getMessages = async (req, res) => {
  try {
    const senderId = req.user._id;
    const receiverId = req.params.id;

    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender) {
      return res.status(404).json({ error: "Sender not found!" });
    }

    if (!receiver) {
      return res.status(404).json({ error: "Receiver not found!" });
    }

    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    }).populate("messages");

    if (!conversation) return res.status(200).json([]);

    return res.status(200).json(conversation.messages);

  } catch (error) {
    console.log("Error in GetMessages controller", error.message);
    return res.status(500).json({ error: "Internal server error!" });
  }
};


// ✅ GET CONVERSATIONS
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate({
        path: "participants",
        select: "fullName username profilePic",
      })
      .populate("messages");

    if (!conversations) {
      return res.status(404).json({ error: "No conversations found!" });
    }

    // ✅ remove current user from participants
    conversations.forEach((conversation) => {
      conversation.participants = conversation.participants.filter(
        (participant) => participant._id.toString() !== userId.toString()
      );
    });

    return res.status(200).json(conversations);

  } catch (error) {
    console.log("Error in GetConversations controller", error);
    return res.status(500).json({ error: "Internal server error!" });
  }
};


// ✅ DELETE SINGLE MESSAGE
export const deleteMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await Conversation.updateOne(
      { messages: messageId },
      { $pull: { messages: messageId } }
    );

    await Message.findByIdAndDelete(messageId);

    return res.status(200).json({ message: "Message deleted" });

  } catch (error) {
    console.log("Delete message error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};


// ✅ DELETE CONVERSATION
export const deleteConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await Message.deleteMany({
      _id: { $in: conversation.messages },
    });

    await Conversation.findByIdAndDelete(conversationId);

    return res.status(200).json({
  success: true,
  message: "Conversation deleted",
});

  } catch (error) {
    console.log("Delete conversation error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: senderId } = req.params;

    const updated = await Message.updateMany(
      {
        sender: senderId,
        receiver: userId,
        read: false,
      },
      {
        $set: { read: true },
      }
    );

    return res.status(200).json({
      success: true,
      updatedCount: updated.modifiedCount,
    });

  } catch (error) {
    console.log("Error marking messages as read", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};