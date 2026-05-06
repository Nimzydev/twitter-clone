import React from "react";
import { FaHeart, FaUser } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

function Ncontainer({ notification }) {
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData(["authUser"]);

  const isReceiverId = notification.receiver._id === authUser?._id;

  const { mutate: deleteOneNotification } = useMutation({
    mutationFn: async (notificationId) => {
      const res = await fetch(`/api/notifications/delete/${notificationId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
    },
    onSuccess: () => {
      toast.success("Notification removed");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="flex items-start justify-between gap-3 p-4 border-b border-gray-800 hover:bg-gray-900 transition">

      {/* LEFT ICON */}
      <div className="pt-1">
        {notification.type === "like" && (
          <FaHeart className="text-red-500" size={16} />
        )}
        {notification.type === "follow" && (
          <FaUser className="text-blue-400" size={16} />
        )}
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 space-y-1">

        {/* USER */}
        <div className="flex items-center gap-2">
          <img
            src={notification.from.profilePic || "/avatar.jpg"}
            alt="user"
            className="w-8 h-8 rounded-full object-cover"
          />
          <span className="text-sm text-gray-300">
            <span className="font-semibold text-white">
              @{notification.from.username}
            </span>{" "}
            {notification.message}
          </span>
        </div>

        {/* POST PREVIEW */}
        {notification.refPost?.text && (
          <div className="bg-gray-800 rounded-lg p-2 text-sm text-gray-300 mt-1">
            {notification.refPost.text}
          </div>
        )}

        {/* RECEIVER PREVIEW */}
        {isReceiverId && (
          <div className="flex items-center gap-2 mt-1">
            <img
              src={authUser?.profilePic || "/avatar.jpg"}
              className="w-6 h-6 rounded-full"
            />
            <span className="text-xs text-gray-400">You</span>
          </div>
        )}
      </div>

      {/* DELETE */}
      <MdDelete
        onClick={() => deleteOneNotification(notification._id)}
        className="text-gray-500 hover:text-red-500 cursor-pointer"
        size={18}
      />
    </div>
  );
}

export default Ncontainer;