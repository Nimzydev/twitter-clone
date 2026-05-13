import React from "react";
import useGetConversation from "../../../zustand/useGetConversations.js";
import { useSocketContext } from "../../context/SocketContext.jsx";

function Messageusers({ chatUser }) {
  const {
    selectedConversation,
    setSelectedConversation,
    unreadCounts,
    messages,
  } = useGetConversation();

  const { onlineUsers } = useSocketContext();

  const isSelected =
    selectedConversation?._id === chatUser?._id;

  const isOnline = onlineUsers.includes(chatUser._id);

  // ✅ LAST MESSAGE FIX (REAL PREVIEW)
  const lastMessage = Array.isArray(messages)
    ? [...messages]
        .filter(
          (m) =>
            m.sender === chatUser._id ||
            m.receiver === chatUser._id
        )
        .slice(-1)[0]
    : null;

  return (
    <div
      onClick={() => setSelectedConversation(chatUser)}
      className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-900 transition ${
        isSelected ? "bg-gray-800" : ""
      }`}
    >
      <div className="relative">
        <img
          src={chatUser?.profilePic || "/avatar.jpg"}
          className="w-10 h-10 rounded-full object-cover"
        />

        {isOnline && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-black" />
        )}
      </div>

      <div className="flex flex-col flex-1">
        <h1 className="text-sm font-semibold">
          {chatUser?.fullName}
        </h1>

        <p className="text-xs text-gray-400 truncate">
          {lastMessage?.text || "No messages yet"}
        </p>
      </div>

      {/* UNREAD */}
      {unreadCounts?.[chatUser._id] > 0 && (
        <div className="min-w-[20px] h-[20px] bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
          {unreadCounts[chatUser._id]}
        </div>
      )}
    </div>
  );
}

export default Messageusers;