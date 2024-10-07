import Message from "../models/messageModel.js";
import Conversation from "../models/conversationModel.js";
import User from "../models/userModel.js";

export const sendMessage = async (req,res) => {
    try {
        const {text} = req.body;
        const {id:receiverId} = req.params;
        const senderId = req.user._id;
        const sender = await User.findById(senderId);
        const receiver = await User.findById(receiverId);

        if (!sender) {
            return res.status(404).json({error: "user not found!"});
        }

        if (!receiver) {
            return res.status(404).json({error: "no user found!"});
        }

        let conversation = await Conversation.findOne({
            participants: {$all: [senderId, receiverId]}
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId]
            });
        }

        const newMessage = new Message({
            sender:senderId,
            receiver:receiverId,
            text:text,
        });

        if (newMessage) {
            conversation.messages.push(newMessage._id);
        }

        await Promise.all([conversation.save(), newMessage.save()]);

        return res.status(200).json(newMessage);


        
    } catch (error) {
        console.log("Error in SendMessage controller", error);
        return res.status(500).json({error: "Internal server error!"});
    }
}

export const getMessages = async (req,res) => {
    try {
        const senderId = req.user._id;
        const sender = await User.findById(senderId);
        const receiverId = req.params.id
        const receiver = await User.findById(receiverId);

        if (!sender) {
            return res.status(404).json({error: "no user found!"});
        }

        if (!receiver) {
            return res.status(404).json({error: "receiver not found!"});
        }

        const conversation = await Conversation.findOne({
            participants: {$all:[senderId, receiverId]}
        }).populate("messages")

        return res.status(200).json(conversation.messages);
        
    } catch (error) {
        console.log("Error in GetMessages controller", error);
        return res.status(500).json({error: "Internal server error!"});
    }
}

export const getConversations = async (req,res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({error: "user not found!"});
        }

        
        const usersToInclude = [userId]
        const messages = await Message.find({sender: userId});

        const conversations = await Conversation.find({participants: userId}).populate({
            path: "participants",
            select: "_id username",
        }).populate("messages")

        

        return res.status(200).json(conversations);



        
        
    } catch (error) {
        console.log("Error in GetConversations controller", error);
        return res.status(500).json({error: "Internal server error!"});
    }
}

export const deleteConversation = async (req,res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        const {id:conversationId} = req.params;
        const conversation = await Conversation.findById(conversationId);
        if (!user) {
            return res.status(404).json({error: "no user found!"});
        }

        if (!conversation) {
            return res.status(400).json({error: "no conversation found!"});
        }

        const deleted = await Conversation.findByIdAndDelete(conversationId);
        await Message.deleteMany({_id: {$in: deleted.messages}});
        return res.status(200).json({message: "conversation deleted successfully"});
        
    } catch (error) {
        console.log("Error in DeleteConversation controller", error);
        return res.status(500).json({error: "Internal server error!"});
    }
}

