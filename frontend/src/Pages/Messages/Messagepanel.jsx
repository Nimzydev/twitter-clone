import React, { useState } from "react";
import useGetConversation from "../../../zustand/useGetConversations.js";
import { useSocketContext } from "../../context/SocketContext";

function Messagepanel({ chatUsers }) {
  const [search, setSearch] = useState("");

  const {
    selectedConversation,
    setSelectedConversation,
    unreadCounts,
    setUnreadCounts,
    lastMessages,
  } = useGetConversation();

  const { onlineUsers } = useSocketContext();

  const filteredUsers = chatUsers?.filter((user) =>
    user.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectConversation = (user) => {
    setSelectedConversation(user);
    // Only clear unread when the user explicitly opens the conversation
    setUnreadCounts((prev) => {
      const updated = { ...prev };
      delete updated[user._id];
      return updated;
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className={`w-full md:w-1/3 border-r border-gray-800 flex flex-col ${
        selectedConversation ? "hidden md:flex" : "flex"
      }`}
    >
      <div className="p-3 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white">Messages</h2>
        <input
          type="text"
          placeholder="Search followers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mt-2 px-3 py-2 rounded-lg bg-gray-900 text-white border border-gray-700"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredUsers?.map((user) => {
          const isOnline = onlineUsers.includes(user._id);
          const unread = unreadCounts?.[user._id] || 0;

          // Real-time Zustand value takes priority over server data
          const realtimeLast = lastMessages?.[user._id];
          const serverLast = user.lastMessage;
          const activeLast = realtimeLast || serverLast;

          const lastText =
            activeLast?.text ||
            (activeLast?.image && "📷 Photo") ||
            (activeLast?.video && "🎥 Video") ||
            (activeLast?.audio && "🎤 Voice message") ||
            "";

          const time = formatTime(activeLast?.createdAt);

          return (
            <div
              key={user._id}
              onClick={() => handleSelectConversation(user)}
              className={`flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-gray-900 transition ${
                selectedConversation?._id === user._id ? "bg-gray-800" : ""
              }`}
            >
              {/* AVATAR */}
              <div className="relative flex-shrink-0">
                <img
                  src={user.profilePic || "/avatar.jpg"}
                  className="w-11 h-11 rounded-full object-cover"
                  alt="avatar"
                />
                {isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-black" />
                )}
              </div>

              {/* NAME + LAST MESSAGE */}
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-semibold text-white truncate">
                    {user.fullName}
                  </p>
                  {time && (
                    <span className="text-[11px] text-gray-400 ml-2 whitespace-nowrap">
                      {time}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate">
                  {lastText || (
                    <span className="italic">No messages yet</span>
                  )}
                </p>
              </div>

              {/* UNREAD BADGE */}
              {unread > 0 && (
                <div className="min-w-[22px] h-[22px] rounded-full bg-red-500 flex items-center justify-center text-xs text-white font-bold px-1 flex-shrink-0">
                  {unread}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Messagepanel;