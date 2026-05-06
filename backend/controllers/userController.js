import User from "../models/userModel.js"; 
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary"; 
import Notifications from "../models/notificationsModel.js";
import mongoose from "mongoose"; 

export const followUnFollow = async (req,res) => {
    try {
        const {id:receiverId} = req.params;
        const userId = req.user._id;
        const user = await User.findById(userId);
        const userToFollow = await User.findById(receiverId);

        if (!user||!userToFollow) {
            return res.status(404).json({error: "User not found"});
        }

        if (receiverId === req.user._id.toString()) {
            return res.status(400).json({error: "You can not follow yourself!"});
        }

        const isFollowing = user.following.includes(receiverId)

        if (isFollowing) {
            await User.findByIdAndUpdate({_id:userId}, {$pull: {following: receiverId}});
            await User.findByIdAndUpdate({_id:receiverId}, {$pull: {followers: userId}});

            return res.status(200).json({message: "You have unfollowed successfully"});
        } else {

            await User.findByIdAndUpdate({_id:userId}, {$push: {following: receiverId}});
            await User.findByIdAndUpdate({_id:receiverId}, {$push: {followers: userId}});

            const newNotification = new Notifications({
                type: "follow",
                from:userId,
                receiver:receiverId,
                message: "followed you"
            });
            
            await newNotification.save();

            return res.status(200).json({message: "You have followed successfully"});
        }

        
        
    } catch (error) {
        console.log("Error in FollowUnFollow controller", error);
        return res.status(500).json({error: "Internal server error"});
    }
}

export const getAllUsers = async (req,res) =>{
    try {
        const userId = req.user._id
        const user = await User.findById(userId);

        if(!user){
            return res.status(404).json({error:"User not found!"})
        }

        const allUsers = await User.find();

        if(!allUsers){
            return res.status(200).json([]);
        }

        return res.status(200).json(allUsers)
        
    } catch (error) {
        console.log("Error in GetAllUsers controller", error)
        return res.status(500).json({error: "Internal server error"})   
    }
}

export const suggestedUsers = async (req,res) => {
    try {
        const userId = req.user._id; 
        const user = await User.findById(userId).select("following");

        const following = user.following;

        const usersToExclude = [userId, ...following];

        const sUsers = await User.find({_id: {$nin: usersToExclude}});

        const finalUsers = sUsers.slice(0,4);

        return res.status(200).json(finalUsers);
        
    } catch (error) {
        console.log("Error in SuggestedUsers controller", error);
        return res.status(500).json({error: "Internal server error"});
        
    }
}

export const updateUser = async (req,res) => {
    const {fullName, username, email, currentPassword, newPassword, bio} = req.body;
    let {profilePic} = req.body;
    let {coverImg} = req.body;

    

    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({error: "no user found"})
        }

        

        if (!currentPassword && newPassword) {
            return res.status(400).json({error: "please provide current passord and new password"});
        }

        if (currentPassword && newPassword) {
            const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordCorrect) {
                return res.status(400).json({error: "current password is incorrect!"});
            }

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        if(profilePic) {
            if (user.profilePic) {
                await cloudinary.uploader.destroy(user.profilePic.split("/").pop().split(".")[0]);
            }
            const upLoadedPic = await cloudinary.uploader.upload(profilePic);
            profilePic = upLoadedPic.secure_url;
        }

        if (coverImg) {
            if (user.coverImg) {
                await cloudinary.uploader.destroy(user.coverImg.split("/").pop().split(".")[0]);
            }

            const upLoadedCoverImg = await cloudinary.uploader.upload(coverImg);
            coverImg = upLoadedCoverImg.secure_url;
        }

        user.fullName = fullName||user.fullName;
        user.username = username||user.username;
        user.email = email||user.email;
        user.profilePic = profilePic||user.profilePic;
        user.coverImg = coverImg||user.coverImg;
        user.bio = bio||user.bio;

        await user.save();

        user.password = null;

        return res.status(200).json(user);

        
    } catch (error) {
        console.log("Error in UpdateUser controller", error);
        return res.status(500).json({error: "Internal server error!"});
    }


}

export const getUserProfile = async (req,res) => {
    try {
        const {query} = req.params;
        let user; 

        if (mongoose.Types.ObjectId.isValid(query)) {
            user = await User.findOne({_id: query});
        } else{
            user = await User.findOne({username: query});
        }

        return res.status(200).json(user);
        
    } catch (error) {
        console.log("Error in GetUserProfile controller", error);
        return res.status(500).json({error: "Internal server error!"});
        
    }
}

export const removeDeletedUser = async (req,res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId).select("following")
        
        if (!user) {
            return res.status(404).json({error: "user not found!"})
        }

        const followingList = user.following

        let deletedUsers = followingList.find((f) => {
            return f === null || undefined;
        });

        const badList = user.following.includes(deletedUsers)

        if (badList) {
            await User.findByIdAndUpdate({_id:userId}, {$pull: {following: deletedUsers}});
        }

        return res.status(200).json({message: "removed deleted users successfully!"});


        
    } catch (error) { 
        console.log("Error in RemoveDeletedUser", error)
        return res.status(500).json({error: "Internal server error"})
        
    }
}

export const getFollowingUsers = async (req,res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId).select("following")

        if(!user){
            return res.status(404).json({error:"User not found!"})
        }

        const following = [...user.following]

        const followingUsers = await User.find({_id: {$in: following }});

        return res.status(200).json(followingUsers);


        
    } catch (error) {
        console.log("Error in GetFollowingUsers controller", error);
        return res.status(500).json({error:"Internal server error"})
    }

}


export const searchUsers = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(200).json([]);
        }

        const users = await User.find({
            $or: [
                { username: { $regex: query, $options: "i" } },
                { fullName: { $regex: query, $options: "i" } },
            ],
        }).select("-password");

        return res.status(200).json(users);
    } catch (error) {
        console.log("Error in searchUsers controller", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};


