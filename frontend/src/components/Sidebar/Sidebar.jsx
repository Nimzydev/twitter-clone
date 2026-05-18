import React from "react";
import { IoHomeOutline, IoLogOut } from "react-icons/io5";
import { IoIosNotificationsOutline } from "react-icons/io";
import { FaRegMessage } from "react-icons/fa6";
import { IoPersonOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import useGetConversation from "../../../zustand/useGetConversations";
import { disconnectSocket } from "../../socket/socketClient";

function Sidebar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData(["authUser"]);

  // Subscribe directly to Zustand store so this component
  // re-renders instantly when unreadCounts changes
  const unreadCounts = useGetConversation((state) => state.unreadCounts);
  const clearAll = useGetConversation((state) => state.clearAll);

  const totalUnread = Object.values(unreadCounts || {}).reduce(
    (acc, val) => acc + (typeof val === "number" ? val : 0),
    0
  );

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/allnotifications");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
  });

  const unreadNotifications =
    notifications?.filter((n) => !n.read)?.length || 0;

  const { mutate: logout } = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Logout failed");
    },
    onSuccess: () => {
      toast.success("Signed out");
      disconnectSocket();
      clearAll();
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const navItem =
    "flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gray-800 cursor-pointer transition";

  return (
    <div className="w-full md:w-64 h-full flex flex-col justify-between border-r border-gray-800 p-3 md:p-5">
      <div className="space-y-2">
        <img src="/twitter.avif" alt="logo" className="w-8 h-8 mb-4 ml-2" />

        <div className={navItem} onClick={() => navigate("/")}>
          <IoHomeOutline size={22} />
          <span className="hidden md:block">Home</span>
        </div>

        <div
          className={`${navItem} relative`}
          onClick={() => navigate("/notifications")}
        >
          <IoIosNotificationsOutline size={22} />
          {unreadNotifications > 0 && (
            <span className="absolute left-6 top-2 bg-red-500 text-xs px-1.5 rounded-full">
              {unreadNotifications}
            </span>
          )}
          <span className="hidden md:block">Notifications</span>
        </div>

        <div
          className={`${navItem} relative`}
          onClick={() => navigate("/messages")}
        >
          <FaRegMessage size={20} />
          {totalUnread > 0 && (
            <span className="absolute left-6 top-2 bg-blue-500 text-xs px-1.5 rounded-full">
              {totalUnread}
            </span>
          )}
          <span className="hidden md:block">Messages</span>
        </div>

        <div
          className={navItem}
          onClick={() => navigate(`/profile/${authUser?.username}`)}
        >
          <IoPersonOutline size={22} />
          <span className="hidden md:block">Profile</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mt-6 bg-gray-900 p-3 rounded-xl">
        <div className="flex items-center gap-3">
          <img
            src={authUser?.profilePic || "/avatar.jpg"}
            alt="avatar"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-white">
              {authUser?.username}
            </p>
            <p className="text-xs text-gray-400">@{authUser?.username}</p>
          </div>
        </div>
        <IoLogOut
          size={20}
          className="cursor-pointer text-gray-400 hover:text-red-500"
          onClick={logout}
        />
      </div>
    </div>
  );
}

export default Sidebar;