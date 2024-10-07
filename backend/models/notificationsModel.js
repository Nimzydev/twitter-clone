import mongoose from "mongoose";

const notificationsSchema = new mongoose.Schema({
    from:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    receiver:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type:{
        type: String,
        required: true,
        enum: ["follow", "like", "retweet", "comment", "message"]
    },
    message:{
        type: String,
    },
    read:{
        type: Boolean,
        default: false,
    },
});

const Notifications = mongoose.model("Notifications", notificationsSchema);

export default Notifications;