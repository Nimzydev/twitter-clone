import Message from "../models/messageModel.js";

import Conversation from "../models/conversationModel.js";

import User from "../models/userModel.js";

import {
  getReceiverId,
  io,
} from "../socket/socket.js";

import { v2 as cloudinary } from "cloudinary";

export const sendMessage = async (
  req,
  res
) => {
  try {
    const { text } = req.body;

    const { id: receiverId } =
      req.params;

    const senderId = req.user._id;

    let conversation =
      await Conversation.findOne({
        participants: {
          $all: [senderId, receiverId],
        },
      });

    if (
      conversation &&
      conversation.deletedFor.includes(
        senderId
      )
    ) {
      conversation.deletedFor.pull(
        senderId
      );

      await conversation.save();
    }

    if (!conversation) {
      conversation =
        await Conversation.create({
          participants: [
            senderId,
            receiverId,
          ],
        });
    }

    let image = "";
    let video = "";
    let audio = "";

    if (req.file) {
      const base64 =
        `data:${req.file.mimetype};base64,` +
        req.file.buffer.toString(
          "base64"
        );

      const uploaded =
        await cloudinary.uploader.upload(
          base64,
          {
            resource_type: "auto",
          }
        );

      if (
        req.file.mimetype.startsWith(
          "image"
        )
      ) {
        image = uploaded.secure_url;
      }

      if (
        req.file.mimetype.startsWith(
          "video"
        )
      ) {
        video = uploaded.secure_url;
      }

      if (
        req.file.mimetype.startsWith(
          "audio"
        )
      ) {
        audio = uploaded.secure_url;
      }
    }

    const newMessage =
      await Message.create({
        sender: senderId,

        receiver: receiverId,

        text,

        image,

        video,

        audio,
      });

    conversation.messages.push(
      newMessage._id
    );

    await conversation.save();

    const receiverSocketId =
      getReceiverId(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit(
        "newMessage",
        newMessage
      );
    }

    return res.status(201).json(
      newMessage
    );
  } catch (error) {
    console.log(
      "sendMessage error:",
      error
    );

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const getMessages = async (
  req,
  res
) => {
  try {
    const senderId = req.user._id;

    const receiverId = req.params.id;

    const conversation =
      await Conversation.findOne({
        participants: {
          $all: [senderId, receiverId],
        },

        deletedFor: {
          $ne: senderId,
        },
      }).populate({
        path: "messages",

        match: {
          deletedFor: {
            $ne: senderId,
          },
        },

        options: {
          sort: {
            createdAt: 1,
          },
        },
      });

    if (!conversation) {
      return res.status(200).json([]);
    }

    return res
      .status(200)
      .json(conversation.messages);
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const getConversations =
  async (req, res) => {
    try {
      const userId = req.user._id;

      const conversations =
        await Conversation.find({
          participants: userId,

          deletedFor: {
            $ne: userId,
          },
        })
          .populate({
            path: "participants",

            select:
              "fullName username profilePic",
          })

          .populate({
            path: "messages",

            options: {
              sort: {
                createdAt: 1,
              },
            },
          })

          .sort({
            updatedAt: -1,
          });

      const formatted =
        conversations.map(
          (conversation) => {
            const otherUser =
              conversation.participants.find(
                (participant) =>
                  participant._id.toString() !==
                  userId.toString()
              );

            const lastMessage =
              conversation.messages[
                conversation.messages
                  .length - 1
              ];

            return {
              ...otherUser.toObject(),

              lastMessage:
                lastMessage?.text ||
                (lastMessage?.image &&
                  "📷 Photo") ||
                (lastMessage?.video &&
                  "🎥 Video") ||
                (lastMessage?.audio &&
                  "🎤 Voice message") ||
                "",
            };
          }
        );

      return res
        .status(200)
        .json(formatted);
    } catch (error) {
      console.log(error);

      return res.status(500).json({
        error: "Internal server error",
      });
    }
  };

export const deleteMessage =
  async (req, res) => {
    try {
      const userId = req.user._id;

      const { messageId } =
        req.params;

      const message =
        await Message.findById(
          messageId
        );

      if (!message) {
        return res.status(404).json({
          error: "Message not found",
        });
      }

      if (
        message.sender.toString() !==
        userId.toString()
      ) {
        return res.status(403).json({
          error: "Not authorized",
        });
      }

      if (
        !message.deletedFor.includes(
          userId
        )
      ) {
        message.deletedFor.push(userId);
      }

      await message.save();

      return res.status(200).json({
        success: true,
      });
    } catch (error) {
      console.log(error);

      return res.status(500).json({
        error: "Internal server error",
      });
    }
  };

export const deleteConversation =
  async (req, res) => {
    try {
      const userId = req.user._id;

      const receiverId =
        req.params.id;

      const conversation =
        await Conversation.findOne({
          participants: {
            $all: [userId, receiverId],
          },
        });

      if (!conversation) {
        return res.status(404).json({
          error:
            "Conversation not found",
        });
      }

      if (
        !conversation.deletedFor.includes(
          userId
        )
      ) {
        conversation.deletedFor.push(
          userId
        );
      }

      await conversation.save();

      return res.status(200).json({
        success: true,
      });
    } catch (error) {
      console.log(error);

      return res.status(500).json({
        error: "Internal server error",
      });
    }
  };

export const markMessagesAsRead =
  async (req, res) => {
    try {
      const userId = req.user._id;

      const { id: senderId } =
        req.params;

      await Message.updateMany(
        {
          sender: senderId,

          receiver: userId,

          read: false,
        },

        {
          $set: {
            read: true,
          },
        }
      );

      return res.status(200).json({
        success: true,
      });
    } catch (error) {
      console.log(error);

      return res.status(500).json({
        error: "Internal server error",
      });
    }
  };