import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import { v2 as cloudinary } from "cloudinary";
import Comment from "../models/commentModel.js";
import Notifications from "../models/notificationsModel.js";

export const createPost = async (req,res) => {
    try {
        const {text,img} = req.body;

        if (!text &&!img) {
            return res.status(400).json({error: "post must have either an img or text!"})
        }

        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({error: "no user found!"})
        }

        if (img) {
            const imageId = await cloudinary.uploader.upload(img)
            img = imageId.secure_url;
        }

        const newPost = new Post({
            user:userId,
            text,
            img,
        });

        await newPost.save();

        return res.status(201).json(newPost);


        
    } catch (error) {
        console.log("Error in CreatePost controller", error);
        return res.status(500).json({error: "Internal server error!"});
        
    }
}

export const likePost = async (req,res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        const {id:postId} = req.params;
        const post = await Post.findById(postId);

        if (!user) {
            return res.status(404).json({error: "user not found!"})
        }

        if (!post) {
            return res.status(400).json({error: "post not found!"})
        }

        const liked = post.likes.includes(userId);

        if (liked) {
            await Post.findByIdAndUpdate({_id:postId}, {$pull: {likes: userId}});
            await User.findByIdAndUpdate({_id:userId}, {$pull: {likedPosts: postId}});

            const newNotification = new Notifications({
                from:userId,
                receiver:post.user._id,
                type: "like",
                message: "liked your post"
            });

            await newNotification.save();

            return res.status(200).json({message: "post unliked successfully"});
        } else {
            await Post.findByIdAndUpdate({_id:postId}, {$push: {likes: userId}});
            await User.findByIdAndUpdate({_id:userId}, {$push: {likedPosts: postId}});
            return res.status(200).json({message: "post liked successfully"});
        }

    } catch (error) {
        console.log("Error in LikePost controller", error);
        return res.status(500).json({error: "Internal server error!"})
        
    }
}



export const deletePost = async (req,res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        const postId = req.params.id
        const post = await Post.findById(postId);

        if (!user) {
            return res.status(404).json({error: "no user found!"});
        }

        if (!post) {
            return res.status(400).json({error: "post not found!"})
        }

        const deleted = await Post.findByIdAndDelete(postId);
        await Comment.deleteMany({_id: {$in: deleted.comment }})
        return res.status(200).json({message: "post deleted successfully"});

        
    } catch (error) {
        console.log("Error in DeletePost controller", error);
        return res.status(500).json({error: "Internal server error!"});        
    }
}

export const commentPost = async (req,res) => {
    try {
        const {text} = req.body;
        const userId = req.user._id;
        const user = await User.findById(userId);
        const postId = req.params.id;
        const post = await Post.findById(postId);

        if (!user) {
            return res.status(404).json({error: "no user found!"});
        }

        if (!post) {
            return res.status(400).json({error: "post not found!"});
        }

        const newComment = new Comment({
            user:userId,
            text:text,
        });

        post.comment.push(newComment._id);
        await newComment.save();
        await post.save();

        const newNotification = new Notifications({
            type: "comment",
            from: userId,
            receiver: post.user._id,
            message: "commented on your post"
        });

        return res.status(201).json(post);

        
    } catch (error) {
        console.log("Error in CommentPost controller", error);
        return res.status(500).json({error: "Internal server error!"});
    }
}

export const deleteComment = async (req,res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        const postId = req.params.id
        const post = await Post.findById(postId);
        const commentId = req.params.id;
        const comment = await Comment.findById(commentId);
        

        if (!user) {
            return res.status(404).json({error: "no user found!"});
        }

        if (!post) {
            return res.status(400).json({error: "post not found"});
        }

        if (!comment) {
            return res.status(400).json({error: "no comment found!"});
        }

        const comments = post.comment.includes(commentId)

        if (comments) {
            await Post.findByIdAndUpdate({_id:postId}, {$pull: {comment: commentId}});
            return res.status(200).json({message: "comment deleted successfully"});
        }
        
    } catch (error) {
        console.log("Error in DeleteComment controller", error);
        return res.status(500).json({error: "Internal server error!"});
    }
}

export const getLikedPosts = async (req,res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({error: "no user found!"})
        }

        const liked = user.likedPosts;

        const allLikedPosts = await Post.find({_id: {$in: liked}})

        return res.status(200).json(allLikedPosts);
        
    } catch (error) {
        console.log("Error in GetLikedPosts controller", error);
        return res.status(500).json({error: "Internal server error!"});
    }
}

export const retweetPost = async (req,res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        const postId = req.params.id;
        const post = await Post.findById(postId);

        if (!user) {
            return res.status(404).json({error: "no user found!"});
        }

        if (!post) {
            return res.status(400).json({error: "no post found!"});
        }

        const retweet = user.retweetPosts.includes(postId) 

        if (retweet) {
            await User.findByIdAndUpdate({_id:userId}, {$pull: {retweetPosts: postId}});
            await Post.findByIdAndUpdate({_id:postId}, {$pull: {retweets: userId}});

            const newNotification = new Notifications({
                from:userId,
                receiver:post.user._id,
                type: "retweet",
                message: "retweeted your post"
            })



            return res.status(200).json({message: "you have unretweeted successfully"});
        } else {
            await User.findByIdAndUpdate({_id:userId}, {$push: {retweetPosts: postId}});
            await Post.findByIdAndUpdate({_id:postId}, {$push: {retweets: userId}});
            return res.status(200).json({message: "post retweeted successfully"});
        }



        
    } catch (error) {
        console.log("Error in RetweetPost controller", error);
        return res.status(500).json({error: "Internal server error!"});
        
    }
}

export const getRetweetedPosts = async (req,res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({error: "user not found!"});
        }

        const retweetedPosts = user.retweetPosts;

        const allRetweetedPosts = await Post.find({_id: {$in: retweetedPosts}});

        return res.status(200).json(allRetweetedPosts);
        
    } catch (error) {
        console.log("Error in GetRetweetedPosts controller", error);
        return res.status(500).json({error: "Internal server error!"});
    }
}







