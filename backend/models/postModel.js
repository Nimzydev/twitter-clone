import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: String,
    img: String,

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],

    retweets: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],

    // 🔥 FIX: explicitly ensure correct ref behavior
    comment: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
        default: [],
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// 🔥 CRITICAL FIX: auto-populate comments + user on EVERY find
function autoPopulate(next) {
  this.populate({
    path: "user",
    select: "fullName username profilePic",
  }).populate({
    path: "comment",
    populate: {
      path: "user",
      select: "fullName username profilePic",
    },
  });

  next();
}

postSchema.pre("find", autoPopulate);
postSchema.pre("findOne", autoPopulate);
postSchema.pre("findById", autoPopulate);

postSchema.index({ user: 1, createdAt: -1 });

const Post = mongoose.model("Post", postSchema);

export default Post;