import React, { useState } from "react";
import "./Post.css";

import { FaComment, FaRetweet, FaRegHeart, FaHeart } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { TailSpin } from "react-loader-spinner";
import { useNavigate } from "react-router-dom";
import PostEngagementModal from "./PostEngagementModal";

function Post({ post }) {
  const [text, setText] = useState("");
  const [openComments, setOpenComments] = useState(false);

  // Modal state — null means closed
  // "likes" or "retweets" means open showing that type
  const [engagementModal, setEngagementModal] = useState(null);

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const authUser = queryClient.getQueryData(["authUser"]);
  const postOwner = post.user;
  const postLiked = post.likes.includes(authUser?._id);
  const postRetweeted = post.retweets.includes(authUser?._id);
  const isMyPost = authUser?._id === post.user._id;

  const goToProfile = (e, username) => {
    e.stopPropagation();
    navigate(`/profile/${username}`);
  };

  const openLikesModal = (e) => {
    e.stopPropagation();
    if (post.likes.length === 0) return;
    setEngagementModal("likes");
  };

  const openRetweetsModal = (e) => {
    e.stopPropagation();
    if (post.retweets.length === 0) return;
    setEngagementModal("retweets");
  };

  // ================= OPTIMISTIC UPDATE =================
  const updatePostInCache = (updater) => {
    queryClient.setQueriesData(
      { queryKey: ["posts"] },
      (oldData) => {
        if (!oldData) return oldData;

        if (oldData.posts) {
          return {
            ...oldData,
            posts: oldData.posts.map((p) =>
              p._id === post._id ? updater(p) : p
            ),
          };
        }

        if (Array.isArray(oldData)) {
          return oldData.map((p) =>
            p._id === post._id ? updater(p) : p
          );
        }

        return oldData;
      }
    );
  };

  // ================= DELETE POST =================
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
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  // ================= LIKE POST =================
  const { mutate: likePost } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/post/like/${post._id}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
    onMutate: async () => {
      updatePostInCache((p) => ({
        ...p,
        likes: postLiked
          ? p.likes.filter((id) => id !== authUser._id)
          : [...p.likes, authUser._id],
      }));
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  // ================= RETWEET =================
  const { mutate: retweetPost } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/post/retweet/${post._id}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
    onMutate: async () => {
      updatePostInCache((p) => ({
        ...p,
        retweets: postRetweeted
          ? p.retweets.filter((id) => id !== authUser._id)
          : [...p.retweets, authUser._id],
      }));
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  // ================= COMMENT POST =================
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
    onSuccess: (newComment) => {
      toast.success("Comment added");
      setText("");
      updatePostInCache((p) => ({
        ...p,
        comment: [...p.comment, newComment],
      }));
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  // ================= DELETE COMMENT =================
  const { mutate: deleteComment, isPending: isDeletingComment } = useMutation({
    mutationFn: async (commentId) => {
      const res = await fetch(
        `/api/post/delete/comment/${post._id}/${commentId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: (_, commentId) => {
      toast.success("Comment deleted");
      updatePostInCache((p) => ({
        ...p,
        comment: p.comment.filter((c) => c._id !== commentId),
      }));
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const handleCommentPost = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    commentPost({ text });
  };

  return (
    <div id={`post-${post._id}`} className="border-b border-gray-800 p-3">

      {/* HEADER */}
      <div className="flex items-center gap-2">
        <img
          onClick={(e) => goToProfile(e, postOwner?.username)}
          src={postOwner?.profilePic || "/avatar.jpg"}
          className="w-8 h-8 rounded-full cursor-pointer object-cover"
          alt="avatar"
        />
        <span
          onClick={(e) => goToProfile(e, postOwner?.username)}
          className="font-semibold text-white text-sm cursor-pointer hover:underline"
        >
          {postOwner?.fullName}
        </span>
        <span
          onClick={(e) => goToProfile(e, postOwner?.username)}
          className="text-gray-400 text-sm cursor-pointer hover:underline"
        >
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

      {/* CONTENT */}
      <div className="mt-2 text-sm text-white">
        {post.text}
        {post.img && (
          <img
            src={post.img}
            className="rounded-lg mt-2 max-h-80 w-full object-cover"
            alt="post"
          />
        )}
      </div>

      {/* ACTIONS */}
      <div className="flex gap-6 mt-3 text-gray-400 text-sm">

        {/* COMMENT */}
        <div
          onClick={() => setOpenComments(!openComments)}
          className="flex items-center gap-1 cursor-pointer hover:text-white"
        >
          <FaComment />
          <span>{post?.comment?.length}</span>
        </div>

        {/* RETWEET — icon toggles, count opens modal */}
        <div className="flex items-center gap-1">
          <FaRetweet
            onClick={retweetPost}
            className={`cursor-pointer ${
              postRetweeted ? "text-green-500" : "hover:text-green-400"
            }`}
          />
          <span
            onClick={openRetweetsModal}
            className={`cursor-pointer ${
              post.retweets.length > 0
                ? "hover:underline hover:text-green-400"
                : "cursor-default"
            }`}
          >
            {post.retweets.length}
          </span>
        </div>

        {/* LIKE — icon toggles, count opens modal */}
        <div className="flex items-center gap-1">
          {postLiked ? (
            <FaHeart
              onClick={likePost}
              className="cursor-pointer text-pink-500"
            />
          ) : (
            <FaRegHeart
              onClick={likePost}
              className="cursor-pointer hover:text-pink-500"
            />
          )}
          <span
            onClick={openLikesModal}
            className={`cursor-pointer ${
              post.likes.length > 0
                ? "hover:underline hover:text-pink-400"
                : "cursor-default"
            }`}
          >
            {post.likes.length}
          </span>
        </div>
      </div>

      {/* COMMENTS SECTION */}
      {openComments && (
        <div className="mt-4 border-t border-gray-800 pt-3 space-y-3">
          <h2 className="text-sm text-gray-400">Comments</h2>

          {post?.comment?.length === 0 && (
            <p className="text-gray-500 text-sm">No comments yet...</p>
          )}

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {post?.comment?.map((comment) => (
              <div key={comment._id} className="flex gap-2">
                <img
                  onClick={(e) => goToProfile(e, comment?.user?.username)}
                  src={comment?.user?.profilePic || "/avatar.jpg"}
                  className="w-7 h-7 rounded-full cursor-pointer"
                  alt="avatar"
                />
                <div className="flex-1 bg-zinc-900 p-2 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span
                      onClick={(e) => goToProfile(e, comment?.user?.username)}
                      className="text-xs text-gray-400 cursor-pointer hover:underline"
                    >
                      @{comment?.user?.username}
                    </span>

                    {comment?.user?._id === authUser?._id &&
                      (isDeletingComment ? (
                        <TailSpin width={14} height={14} color="white" />
                      ) : (
                        <MdDelete
                          onClick={() => deleteComment(comment._id)}
                          className="text-gray-500 cursor-pointer hover:text-red-500"
                          size={16}
                        />
                      ))}
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

      {/* ENGAGEMENT MODAL */}
      {engagementModal && (
        <PostEngagementModal
          postId={post._id}
          type={engagementModal}
          onClose={() => setEngagementModal(null)}
        />
      )}
    </div>
  );
}

export default Post;