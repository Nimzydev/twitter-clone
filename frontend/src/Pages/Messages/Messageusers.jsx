import React from "react";
import useGetConversation from "../../../zustand/useGetConversations";
import { useSocketContext } from "../../context/SocketContext";

function Messageusers({ chatUser }) {
  const {
    selectedConversation,
    setSelectedConversation,
    unreadCounts,
  } = useGetConversation();

  const { onlineUsers } = useSocketContext();

  const isOnline = onlineUsers.includes(chatUser._id);

  const lastMessageText =
    chatUser.lastMessage?.text || "No messages yet";

  const time = chatUser.lastMessage?.createdAt
    ? new Date(chatUser.lastMessage.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const unread = unreadCounts?.[chatUser._id] || 0;

  return (
    <div
      onClick={() => setSelectedConversation(chatUser)}
      className="flex items-center gap-3 px-3 py-3 hover:bg-gray-900 cursor-pointer"
    >
      {/* AVATAR */}
      <div className="relative">
        <img
          src={chatUser.profilePic || "/avatar.jpg"}
          className="w-11 h-11 rounded-full object-cover"
        />

        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-black" />
        )}
      </div>

      {/* MIDDLE */}
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <p className="text-sm font-semibold truncate">
            {chatUser.fullName}
          </p>

          <span className="text-[11px] text-gray-400 ml-2 whitespace-nowrap">
            {time}
          </span>
        </div>

        <p className="text-xs text-gray-400 truncate">
          {lastMessageText}
        </p>
      </div>

      {/* UNREAD BADGE */}
      {unread > 0 && (
        <div className="bg-green-500 text-xs min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-white px-1">
          {unread}
        </div>
      )}
    </div>
  );
}

export default Messageusers;