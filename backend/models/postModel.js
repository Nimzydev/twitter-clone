import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    text:{
        type: String,
    },
    img:{
        type: String,
    },
    likes:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: []
        }
    ],
    retweets:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    comment:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
            default: []
        }
    ],
});

const Post = mongoose.model("Post", postSchema);

export default Post;