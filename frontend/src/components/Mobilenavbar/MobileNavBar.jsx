import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome, FaBell, FaEnvelope, FaUser } from "react-icons/fa";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useSocketContext } from "../../context/SocketContext";

function MobileNavbar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData(["authUser"]);
  const { socket } = useSocketContext();

  const [unreadMessages, setUnreadMessages] = useState(0);

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

  useEffect(() => {
    if (!socket) return;

    socket.on("newMessage", () => {
      setUnreadMessages((prev) => prev + 1);
    });

    return () => socket.off("newMessage");
  }, [socket]);

  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden bg-black border-t border-gray-800 flex justify-around items-center py-3 z-50">

      <FaHome
        className="text-xl cursor-pointer"
        onClick={() => navigate("/")}
      />

      {/* 🔔 NOTIFS */}
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

      {/* 💬 MESSAGES */}
      <div className="relative">
        <FaEnvelope
          className="text-xl cursor-pointer"
          onClick={() => navigate("/messages")}
        />
        {unreadMessages > 0 && (
          <span className="absolute -top-2 -right-2 bg-blue-500 text-xs px-1.5 rounded-full">
            {unreadMessages}
          </span>
        )}
      </div>

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
    </div>
  );
}

export default MobileNavbar;