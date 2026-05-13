import React from "react";
import {
  FaHeart,
  FaUser,
  FaRetweet,
  FaComment,
} from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

function Ncontainer({ notification }) {
  const queryClient = useQueryClient();

  const navigate = useNavigate();

  const authUser = queryClient.getQueryData(["authUser"]);

  const isReceiverId =
    notification.receiver._id === authUser?._id;

  const goToProfile = (e) => {
    e.stopPropagation();

    navigate(
      `/profile/${notification.from.username}`
    );
  };

  const goToPost = () => {
    if (!notification.refPost?._id) return;

    navigate(`/?postId=${notification.refPost._id}`);

    setTimeout(() => {
      const el = document.getElementById(
        `post-${notification.refPost._id}`
      );

      if (el) {
        el.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 500);
  };

  const { mutate: deleteOneNotification } = useMutation({
    mutationFn: async (notificationId) => {
      const res = await fetch(
        `/api/notifications/delete/${notificationId}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);
    },

    onSuccess: () => {
      toast.success("Notification removed");

      queryClient.invalidateQueries({
        queryKey: ["notifications"],
      });
    },

    onError: (error) => toast.error(error.message),
  });

  const renderIcon = () => {
    switch (notification.type) {
      case "like":
        return (
          <FaHeart
            className="text-red-500"
            size={16}
          />
        );

      case "follow":
        return (
          <FaUser
            className="text-blue-400"
            size={16}
          />
        );

      case "retweet":
        return (
          <FaRetweet
            className="text-green-500"
            size={16}
          />
        );

      case "comment":
        return (
          <FaComment
            className="text-yellow-400"
            size={16}
          />
        );

      default:
        return (
          <FaUser
            className="text-gray-400"
            size={16}
          />
        );
    }
  };

  return (
    <div
      className={`flex items-start justify-between gap-3 p-4 border-b border-gray-800 hover:bg-gray-900 transition ${
        !notification.read
          ? "bg-gray-900/60"
          : ""
      }`}
    >
      <div className="pt-1">
        {renderIcon()}
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <img
            onClick={goToProfile}
            src={
              notification.from.profilePic ||
              "/avatar.jpg"
            }
            alt="user"
            className="w-8 h-8 rounded-full object-cover cursor-pointer"
          />

          <span className="text-sm text-gray-300 break-words">
            <span
              onClick={goToProfile}
              className="font-semibold text-white cursor-pointer hover:underline"
            >
              @{notification.from.username}
            </span>{" "}
            {notification.message}
          </span>
        </div>

        {notification.refPost?.text && (
          <div
            onClick={goToPost}
            className="bg-gray-800 rounded-lg p-3 text-sm text-gray-300 mt-2 border border-gray-700 cursor-pointer hover:bg-gray-700 transition"
          >
            <p className="line-clamp-3 break-words">
              {notification.refPost.text}
            </p>

            <p className="text-xs text-blue-400 mt-2">
              View post
            </p>
          </div>
        )}

        {isReceiverId && (
          <div className="flex items-center gap-2 mt-1">
            <img
              src={
                authUser?.profilePic ||
                "/avatar.jpg"
              }
              className="w-6 h-6 rounded-full"
            />

            <span className="text-xs text-gray-400">
              You
            </span>
          </div>
        )}
      </div>

      <MdDelete
        onClick={() =>
          deleteOneNotification(notification._id)
        }
        className="text-gray-500 hover:text-red-500 cursor-pointer flex-shrink-0"
        size={18}
      />
    </div>
  );
}

export default Ncontainer;