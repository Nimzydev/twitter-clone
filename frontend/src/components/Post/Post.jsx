import React, { useState } from "react";
import "./Post.css";
import { FaComment } from "react-icons/fa";
import { FaRetweet } from "react-icons/fa6";
import { FaRegHeart } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { TailSpin } from "react-loader-spinner";

function Post({ post }) {
  const [text, setText] = useState("");
  const [openComments, setOpenComments] = useState(false);

  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData(["authUser"]);
  const postClient = useQueryClient();

  const postOwner = post.user;

  const postLiked = post.likes.includes(authUser?._id);
  const postRetweeted = post.retweets.includes(authUser?._id);
  const isMyPost = authUser?._id === post.user._id;

  // =========================
  // MUTATIONS (UNCHANGED)
  // =========================

  const { mutate: deletePost, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/post/delete/${post._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
    },
    onSuccess: () => {
      toast.success("Post deleted");
      postClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const { mutate: likePost, isPending: isLiking } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/post/like/${post._id}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: (updatedLikes) => {
      postClient.setQueryData(["posts"], (old) =>
        old.map((p) =>
          p._id === post._id ? { ...p, likes: updatedLikes } : p
        )
      );
    },
  });

  const { mutate: retweetPost, isPending: isRetweeting } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/post/retweet/${post._id}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: (updatedRetweets) => {
      postClient.setQueryData(["posts"], (old) =>
        old.map((p) =>
          p._id === post._id ? { ...p, retweets: updatedRetweets } : p
        )
      );
    },
  });

  const { mutate: commentPost, isPending: isCommenting } = useMutation({
    mutationFn: async ({ text }) => {
      const res = await fetch(`/api/post/comment/${post._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success("Comment added");
      setText("");
      postClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const { mutate: deleteComment, isPending: isDeletingComment } =
    useMutation({
      mutationFn: async (commentId) => {
        const res = await fetch(
          `/api/post/delete/comment/${post._id}/${commentId}`,
          { method: "DELETE" }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
      },
      onSuccess: () => {
        toast.success("Comment deleted");
        postClient.invalidateQueries({ queryKey: ["posts"] });
      },
    });

  const handleCommentPost = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    commentPost({ text });
  };

  // =========================
  // UI
  // =========================

  return (
    <div className="border-b border-gray-800 p-3">

      {/* HEADER */}
      <div className="flex items-center gap-2">
        <img
          src={postOwner.profilePic || "/avatar.jpg"}
          className="w-8 h-8 rounded-full"
        />
        <span className="font-semibold text-white text-sm">
          {postOwner?.fullName}
        </span>
        <span className="text-gray-400 text-sm">
          @{postOwner?.username}
        </span>

        {isMyPost && (
          <div className="ml-auto">
            {isDeleting ? (
              <TailSpin width={20} height={20} color="white" />
            ) : (
              <MdDelete
                onClick={deletePost}
                className="text-gray-400 cursor-pointer hover:text-red-500"
              />
            )}
          </div>
        )}
      </div>

      {/* BODY */}
      <div className="mt-2 text-sm text-white">
        {post.text}
        {post.img && (
          <img
            src={post.img}
            className="rounded-lg mt-2 max-h-80 w-full object-cover"
          />
        )}
      </div>

      {/* FOOTER */}
      <div className="flex gap-6 mt-3 text-gray-400 text-sm">
        <div
          onClick={() => setOpenComments(!openComments)}
          className="flex items-center gap-1 cursor-pointer hover:text-white"
        >
          <FaComment />
          <span>{post?.comment?.length}</span>
        </div>

        <div
          onClick={retweetPost}
          className="flex items-center gap-1 cursor-pointer hover:text-green-400"
        >
          <FaRetweet />
          <span>{post.retweets.length}</span>
        </div>

        <div
          onClick={likePost}
          className="flex items-center gap-1 cursor-pointer hover:text-pink-500"
        >
          <FaRegHeart />
          <span>{post.likes.length}</span>
        </div>
      </div>

      {/* ========================= */}
      {/* ✅ CLEAN COMMENT SECTION */}
      {/* ========================= */}

      {openComments && (
        <div className="mt-4 border-t border-gray-800 pt-3 space-y-3">

          <h2 className="text-sm text-gray-400">Comments</h2>

          {/* NO COMMENTS */}
          {post?.comment?.length === 0 && (
            <p className="text-gray-500 text-sm">
              No comments yet...
            </p>
          )}

          {/* COMMENTS LIST */}
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {post?.comment?.map((comment) => (
              <div key={comment._id} className="flex gap-2">

                <img
                  src={comment?.user?.profilePic || "/avatar.jpg"}
                  className="w-7 h-7 rounded-full"
                />

                <div className="flex-1 bg-zinc-900 p-2 rounded-xl">

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      @{comment?.user?.username}
                    </span>

                    {comment?.user?._id === authUser?._id && (
                      isDeletingComment ? (
                        <TailSpin width={14} height={14} color="white" />
                      ) : (
                        <MdDelete
                          onClick={() => deleteComment(comment._id)}
                          className="text-gray-500 cursor-pointer hover:text-red-500"
                          size={16}
                        />
                      )
                    )}
                  </div>

                  <p className="text-sm text-white mt-1 break-words">
                    {comment?.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* COMMENT INPUT */}
          <form
            onSubmit={handleCommentPost}
            className="flex items-center gap-2 mt-2"
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-3 py-2 rounded-full bg-zinc-900 text-white text-sm outline-none border border-gray-700 focus:border-gray-500"
            />

            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-full text-sm"
            >
              {isCommenting ? (
                <TailSpin width={16} height={16} color="white" />
              ) : (
                "Post"
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Post;