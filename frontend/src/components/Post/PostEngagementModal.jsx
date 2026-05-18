import React, { useEffect, useState } from "react";
import { IoMdClose } from "react-icons/io";
import { FaHeart, FaRetweet } from "react-icons/fa";
import { TailSpin } from "react-loader-spinner";
import { useNavigate } from "react-router-dom";

function PostEngagementModal({ postId, type, onClose }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!postId || !type) return;

    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const endpoint =
          type === "likes"
            ? `/api/post/likers/${postId}`
            : `/api/post/retweeters/${postId}`;

        const res = await fetch(endpoint, { credentials: "include" });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error);
        setUsers(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [postId, type]);

  const handleUserClick = (username) => {
    onClose();
    navigate(`/profile/${username}`);
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        className="bg-black border border-gray-800 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            {type === "likes" ? (
              <FaHeart className="text-pink-500" size={18} />
            ) : (
              <FaRetweet className="text-green-500" size={18} />
            )}
            <h2 className="text-lg font-semibold text-white">
              {type === "likes" ? "Liked by" : "Retweeted by"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <IoMdClose size={22} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="overflow-y-auto max-h-[65vh]">
          {isLoading && (
            <div className="flex justify-center py-8">
              <TailSpin width={36} height={36} color="white" />
            </div>
          )}

          {!isLoading && users.length === 0 && (
            <p className="text-center text-gray-400 py-8">
              {type === "likes" ? "No likes yet" : "No retweets yet"}
            </p>
          )}

          {!isLoading &&
            users.map((user) => (
              <div
                key={user._id}
                onClick={() => handleUserClick(user.username)}
                className="flex items-center gap-3 p-4 border-b border-gray-900 hover:bg-gray-900 cursor-pointer transition"
              >
                <img
                  src={user.profilePic || "/avatar.jpg"}
                  alt="profile"
                  className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex flex-col min-w-0">
                  <p className="text-white font-semibold truncate">
                    {user.fullName}
                  </p>
                  <p className="text-gray-400 text-sm truncate">
                    @{user.username}
                  </p>
                  {user.bio && (
                    <p className="text-gray-500 text-xs mt-1 line-clamp-1">
                      {user.bio}
                    </p>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default PostEngagementModal;