import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    text:{
        type: String,
    }
});

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;