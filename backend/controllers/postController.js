import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import Comment from "../models/commentModel.js";
import { createNotification } from "./notificationsController.js";
import { v2 as cloudinary } from "cloudinary";

const postPopulate = {
  path: "user",
  select: "fullName username profilePic",
};

const commentPopulate = {
  path: "comment",
  populate: {
    path: "user",
    select: "fullName username profilePic",
  },
};

const populatePost = (query) => {
  return query.populate(postPopulate).populate(commentPopulate);
};

export const createPost = async (req, res) => {
  try {
    const { text } = req.body;
    let { img } = req.body;

    if (!text && !img) {
      return res
        .status(400)
        .json({ error: "post must have either text or img" });
    }

    const userId = req.user._id;

    if (img) {
      const upload = await cloudinary.uploader.upload(img);
      img = upload.secure_url;
    }

    const newPost = await Post.create({ user: userId, text, img });

    const populatedPost = await populatePost(Post.findById(newPost._id));

    return res.status(201).json(populatedPost);
  } catch (error) {
    console.log("createPost error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const likePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const alreadyLiked = post.likes.some(
      (id) => id.toString() === userId.toString()
    );

    if (alreadyLiked) {
      post.likes.pull(userId);
      await User.findByIdAndUpdate(userId, {
        $pull: { likedPosts: post._id },
      });
      await post.save();
      return res.status(200).json({ likes: post.likes, message: "unliked" });
    }

    post.likes.push(userId);
    await User.findByIdAndUpdate(userId, {
      $addToSet: { likedPosts: post._id },
    });
    await post.save();

    if (post.user.toString() !== userId.toString()) {
      await createNotification({
        from: userId,
        receiver: post.user,
        type: "like",
        message: "liked your post",
        refPost: post._id,
      });
    }

    return res.status(200).json({ likes: post.likes, message: "liked" });
  } catch (error) {
    console.log("likePost error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deletePost = async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "deleted" });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const commentPost = async (req, res) => {
  try {
    const comment = await Comment.create({
      user: req.user._id,
      text: req.body.text,
    });

    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $push: { comment: comment._id } },
      { new: true }
    );

    if (post && post.user.toString() !== req.user._id.toString()) {
      await createNotification({
        from: req.user._id,
        receiver: post.user,
        type: "comment",
        message: "commented on your post",
        refPost: post._id,
        refComment: comment._id,
      });
    }

    const populatedComment = await Comment.findById(comment._id).populate(
      "user",
      "fullName username profilePic"
    );

    return res.status(201).json(populatedComment);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteComment = async (req, res) => {
  try {
    await Post.findByIdAndUpdate(req.params.postId, {
      $pull: { comment: req.params.commentId },
    });
    await Comment.findByIdAndDelete(req.params.commentId);
    return res.status(200).json({ message: "comment deleted" });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getLikedPosts = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const posts = await populatePost(
      Post.find({ _id: { $in: user.likedPosts } }).sort({ createdAt: -1 })
    );

    return res.status(200).json(posts);
  } catch (error) {
    console.log("getLikedPosts error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const retweetPost = async (req, res) => {
  try {
    const userId = req.user._id;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const alreadyRetweeted = post.retweets.some(
      (id) => id.toString() === userId.toString()
    );

    if (alreadyRetweeted) {
      post.retweets.pull(userId);
      await User.findByIdAndUpdate(userId, {
        $pull: { retweetPosts: post._id },
      });
      await post.save();
      return res
        .status(200)
        .json({ retweets: post.retweets, message: "unretweeted" });
    }

    post.retweets.push(userId);
    await User.findByIdAndUpdate(userId, {
      $addToSet: { retweetPosts: post._id },
    });
    await post.save();

    if (post.user.toString() !== userId.toString()) {
      await createNotification({
        from: userId,
        receiver: post.user,
        type: "retweet",
        message: "retweeted your post",
        refPost: post._id,
      });
    }

    return res
      .status(200)
      .json({ retweets: post.retweets, message: "retweeted" });
  } catch (error) {
    console.log("retweetPost error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getRetweetedPosts = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const posts = await populatePost(
      Post.find({ _id: { $in: user.retweetPosts } }).sort({ createdAt: -1 })
    );

    return res.status(200).json(posts);
  } catch (error) {
    console.log("getRetweetedPosts error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getFollowingPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const posts = await populatePost(
      Post.find({ user: { $in: user.following } }).sort({ createdAt: -1 })
    );
    return res.status(200).json(posts);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getOwnPosts = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    const posts = await populatePost(
      Post.find({ user: user._id }).sort({ createdAt: -1 })
    );
    return res.status(200).json(posts);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getHomePosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId);

    const postsQuery = Post.find({
      $or: [{ user: userId }, { user: { $in: user.following } }],
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const posts = await populatePost(postsQuery);

    const totalPosts = await Post.countDocuments({
      $or: [{ user: userId }, { user: { $in: user.following } }],
    });

    return res.status(200).json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ================= GET POST LIKERS =================
// Returns the list of users who liked a specific post
export const getPostLikers = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "likes",
      "fullName username profilePic bio"
    );

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    return res.status(200).json(post.likes);
  } catch (error) {
    console.log("getPostLikers error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ================= GET POST RETWEETERS =================
// Returns the list of users who retweeted a specific post
export const getPostRetweeters = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "retweets",
      "fullName username profilePic bio"
    );

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    return res.status(200).json(post.retweets);
  } catch (error) {
    console.log("getPostRetweeters error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};