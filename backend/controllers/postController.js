import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import Comment from "../models/commentModel.js";
import { v2 as cloudinary } from "cloudinary"; 
import Notifications from "../models/notificationsModel.js";  

export const createPost = async (req,res) => {
    try {
        const {text} = req.body;
        let {img} = req.body;

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

            const updatedLikes = post.likes.filter((id) => id.toString() !== userId.toString());


            return res.status(200).json(updatedLikes);
        } else {

            post.likes.push(userId) 
            await User.updateOne({_id:userId}, {$push: {likedPosts: postId}});
            await post.save();

            const newNotification = new Notifications({
                from:userId,
                receiver:post.user,
                type: "like",
                message: "liked your post",
                refPost: postId,
            });

            await newNotification.save();

            const updatedLikes = post.likes;
            return res.status(200).json(updatedLikes);
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
        const post = await Post.findById(postId).populate({
            path: 'comment',
            populate:{
                path: 'user',
                model: 'User',
            }
        }).populate({
            path: "user", 
            select: "fullName username email profilePic"
        });

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

        await newComment.save();

        const comment = await Comment.findById(newComment._id).populate({
            path: "user",
            select: "fullName email username profilePic"
        });


        post.comment.push(comment._id);

        const newNotification = new Notifications({
            type: "comment",
            from: userId,
            receiver: post.user._id,
            message: "commented on your post",
            refPost: postId,
            refComment: comment._id,
        });

        Promise.all([
            await post.save(),
            await newNotification.save(),
        ])

        return res.status(201).json(post.comment);

        
    } catch (error) {
        console.log("Error in CommentPost controller", error);
        return res.status(500).json({error: "Internal server error!"});
    }
}

export const deleteComment = async (req,res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        const {postId} = req.params;
        const post = await Post.findById(postId)
        const {commentId} = req.params;
        const comment = await Comment.findById(commentId);
        

        if (!user) {
            return res.status(404).json({error: "no user found!"});
        }

        if(!post){
            return res.status(404).json({error: "no post found!"})
        }

        if (!comment) {
            return res.status(400).json({error: "no comment found!"}); 
        }

        const comments = post.comment.includes(commentId)

        if(!comments){
            return res.status(400).json({error:"Comment is not in this post!"})
        }

        if (comments) {
            const post = await Post.findByIdAndUpdate({_id:postId}, {$pull: {comment: commentId}});
            await post.save();
            await Comment.findByIdAndDelete(commentId)
            return res.status(200).json({message: "comment deleted successfully"});
        }
        
    } catch (error) {
        console.log("Error in DeleteComment controller", error);
        return res.status(500).json({error: "Internal server error!"});
    }
}

export const getLikedPosts = async (req,res) => {

    const userId = req.params.id;



    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({error: "no user found!"})
        }

        const allLikedPosts = await Post.find({_id: {$in: user.likedPosts}}).populate({
            path: "user",
            select: "-password",
        }).populate({
            path: 'comment',
            populate:{
                path: 'user',
                model: 'User',
            }
        })

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

            const updatedRetweets = post.retweets.filter((id) => id.toString() !== userId.toString());

            return res.status(200).json(updatedRetweets);
        } else {
            post.retweets.push(userId)
            await User.updateOne({_id:userId}, {$push: {retweetPosts: postId}});
            post.save();

            const newNotification = new Notifications({
                from:userId,
                receiver:post.user._id,
                type: "retweet",
                message: "retweeted your post",
                refPost:postId,
            });

            await newNotification.save();

            const updatedRetweets = post.retweets;


            return res.status(200).json(updatedRetweets);
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

        const allRetweetedPosts = await Post.find({_id: {$in: retweetedPosts}}).populate({
            path: 'comment',
            populate:{
                path: 'user',
                model: 'User',
            }
        });

        return res.status(200).json(allRetweetedPosts);
        
    } catch (error) {
        console.log("Error in GetRetweetedPosts controller", error);
        return res.status(500).json({error: "Internal server error!"});
    }
}

export const getFollowingPosts = async (req,res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({error: "user not found!"});
        }

        const following = user.following;

        const followingPosts = await Post.find({user: {$in: following }}).populate({
            path: "user",
            select: "fullName username email",
        }).populate({
            path: 'comment',
            populate:{
                path: 'user',
                model: 'User',
            }
        });

        return res.status(200).json(followingPosts);
        
    } catch (error) {
        console.log("Error in GetFollowingPosts controller", error);
        return res.status(500).json({error: "Internal server error!"});
        
    }
}

export const getOwnPosts = async(req,res) => {
    try {
        const {username} = req.params;
        const user = await User.findOne({username});

        if (!user) {
            return res.status(404).json({error: "user not found!"});
        }

        const posts = await Post.find({user: user._id}).sort({createdAt: -1}).populate
        ({
            path: "user",
            select: "-password"
        }).populate({
            path: 'comment',
            populate:{
                path: 'user',
                model: 'User',
            }
            
        });

        return res.status(200).json(posts);
        
    } catch (error) {
        console.log("Error in GetOwnPosts controller", error);
        return res.status(500).json({error: "Internal server error!"});
        
    }
}


export const getHomePosts = async(req,res) =>{
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);

        if(!user){
            return res.status(404).json({error:"User not found!"});
        }

        const myFollowers = [...user.following]

        if(!myFollowers){
            return res.status(404).json({error:"Error getting your followers list!"})
        }

        const finalPosts = await Post.find({
            $or:[
                {user: userId},
                {user: {$in: myFollowers}},
            ]
        }).populate({
            path: "user",
            select: "fullName username email profilePic",
        }).populate({
            path: 'comment',
            populate:{
                path: 'user',
                select: 'fullName username email profilePic',
                model: 'User',
            }
        }) 

        if(!finalPosts){
            return res.status(200).json([]);
        }

        return res.status(200).json(finalPosts)
        
    } catch (error) {
        console.log("Error in GetHomePosts controller", error)
        return res.status(500).json({error:"Internal server error!"}) 
    }

}



    

