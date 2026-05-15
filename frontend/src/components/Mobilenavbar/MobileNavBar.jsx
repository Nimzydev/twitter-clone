import React from "react";
import { useNavigate } from "react-router-dom";
import { FaHome, FaBell, FaEnvelope, FaUser } from "react-icons/fa";
import { IoLogOutOutline } from "react-icons/io5";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import useGetConversation from "../../../zustand/useGetConversations";

function MobileNavbar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData(["authUser"]);

  // Read unread badge count purely from Zustand — same source as Sidebar
  const { unreadCounts } = useGetConversation();
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
      return data;
    },
    onSuccess: () => {
      toast.success("Signed out");
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden bg-black border-t border-gray-800 flex justify-around items-center py-3 z-50">

      {/* HOME */}
      <FaHome
        className="text-xl cursor-pointer"
        onClick={() => navigate("/")}
      />

      {/* NOTIFICATIONS */}
      <div className="relative">
        <FaBell
          className="text-xl cursor-pointer"
          onClick={() => navigate("/notifications")}
        />
        {unreadNotifications > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-xs px-1.5 rounded-full">
            {unreadNotifications}
          </span>
        )}
      </div>

      {/* MESSAGES */}
      <div className="relative">
        <FaEnvelope
          className="text-xl cursor-pointer"
          onClick={() => navigate("/messages")}
        />
        {totalUnread > 0 && (
          <span className="absolute -top-2 -right-2 bg-blue-500 text-xs px-1.5 rounded-full">
            {totalUnread}
          </span>
        )}
      </div>

      {/* PROFILE */}
      <div
        className="cursor-pointer flex items-center justify-center"
        onClick={() => {
          if (!authUser?.username) return;
          navigate(`/profile/${authUser.username}`);
        }}
      >
        {authUser?.profilePic ? (
          <img
            src={authUser.profilePic}
            alt="profile"
            className="w-7 h-7 rounded-full object-cover"
          />
        ) : (
          <FaUser className="text-xl" />
        )}
      </div>

      {/* LOGOUT */}
      <button
        onClick={logout}
        className="flex items-center justify-center"
      >
        <IoLogOutOutline className="text-2xl text-gray-300 hover:text-red-500 transition" />
      </button>
    </div>
  );
}

export default MobileNavbar;