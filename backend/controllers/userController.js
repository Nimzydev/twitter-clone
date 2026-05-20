import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import Post from "../models/postModel.js";
import Comment from "../models/commentModel.js";
import Message from "../models/messageModel.js";
import Notifications from "../models/notificationsModel.js";
import { createNotification } from "./notificationsController.js";

export const followUnFollow = async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    const userToFollow = await User.findById(receiverId);

    if (!user || !userToFollow) {
      return res.status(404).json({ error: "User not found" });
    }

    if (receiverId === userId.toString()) {
      return res.status(400).json({ error: "You cannot follow yourself" });
    }

    const isFollowing = user.following.includes(receiverId);

    if (isFollowing) {
      await User.findByIdAndUpdate(userId, { $pull: { following: receiverId } });
      await User.findByIdAndUpdate(receiverId, { $pull: { followers: userId } });
      return res.status(200).json({ message: "Unfollowed successfully" });
    } else {
      await User.findByIdAndUpdate(userId, { $push: { following: receiverId } });
      await User.findByIdAndUpdate(receiverId, { $push: { followers: userId } });

      await createNotification({
        type: "follow",
        from: userId,
        receiver: receiverId,
        message: "followed you",
      });

      return res.status(200).json({ message: "Followed successfully" });
    }
  } catch (error) {
    console.log("Error in followUnFollow", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    return res.status(200).json(users);
  } catch (error) {
    console.log("Error in getAllUsers", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const suggestedUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const users = await User.find({
      _id: { $ne: userId, $nin: user.following },
    })
      .select("-password")
      .limit(10);

    return res.status(200).json(users);
  } catch (error) {
    console.log("Error in suggestedUsers", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateUser = async (req, res) => {
  const { fullName, username, email, currentPassword, newPassword, bio } =
    req.body;

  let { profilePic } = req.body;
  let { coverImg } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check email uniqueness — only if the user is changing their email
    if (email && email !== user.email) {
      const emailTaken = await User.findOne({
        email,
        _id: { $ne: req.user._id },
      });
      if (emailTaken) {
        return res.status(400).json({
          error: "This email address is already in use by another account",
        });
      }
    }

    // Check username uniqueness — only if the user is changing their username
    if (username && username !== user.username) {
      const usernameTaken = await User.findOne({
        username,
        _id: { $ne: req.user._id },
      });
      if (usernameTaken) {
        return res.status(400).json({
          error: "This username is already taken",
        });
      }
    }

    if (currentPassword && newPassword) {
      const isPasswordCorrect = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!isPasswordCorrect) {
        return res.status(400).json({ error: "Current password incorrect" });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    if (profilePic) {
      if (user.profilePic) {
        await cloudinary.uploader.destroy(
          user.profilePic.split("/").pop().split(".")[0]
        );
      }
      const uploaded = await cloudinary.uploader.upload(profilePic);
      profilePic = uploaded.secure_url;
    }

    if (coverImg) {
      if (user.coverImg) {
        await cloudinary.uploader.destroy(
          user.coverImg.split("/").pop().split(".")[0]
        );
      }
      const uploaded = await cloudinary.uploader.upload(coverImg);
      coverImg = uploaded.secure_url;
    }

    user.fullName = fullName || user.fullName;
    user.username = username || user.username;
    user.email = email || user.email;
    user.profilePic = profilePic || user.profilePic;
    user.coverImg = coverImg || user.coverImg;
    user.bio = bio || user.bio;

    await user.save();
    user.password = null;

    return res.status(200).json(user);
  } catch (error) {
    console.log("Error in updateUser", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const { query } = req.params;
    let user;

    if (mongoose.Types.ObjectId.isValid(query)) {
      user = await User.findById(query);
    } else {
      user = await User.findOne({ username: query });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.log("Error in getUserProfile", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const removeDeletedUser = async (req, res) => {
  try {
    return res.status(200).json({ message: "removeDeletedUser completed" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getFollowingUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "following",
      "fullName username profilePic"
    );
    return res.status(200).json(user.following);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserFollowers = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).populate(
      "followers",
      "fullName username profilePic bio"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json(user.followers);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserFollowing = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).populate(
      "following",
      "fullName username profilePic bio"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json(user.following);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

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
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deactivateAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.isDeactivated = true;
    await user.save();

    return res.status(200).json({ message: "Account deactivated" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await Post.deleteMany({ user: userId });
    await Comment.deleteMany({ user: userId });
    await Notifications.deleteMany({
      $or: [{ from: userId }, { receiver: userId }],
    });
    await Message.deleteMany({
      $or: [{ sender: userId }, { receiver: userId }],
    });
    await User.updateMany(
      {},
      { $pull: { followers: userId, following: userId } }
    );
    await User.findByIdAndDelete(userId);

    res.cookie("jwt", "", { maxAge: 0 });

    return res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.log("Error deleting account", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};