import React from "react";
import "./Messageusers.css";
import useGetConversation from "../../../zustand/useGetConversations.js";
import { useSocketContext } from "../../context/SocketContext.jsx";

function Messageusers({ chatUser }) {
  const { selectedConversation, setSelectedConversation } =
    useGetConversation();

  const { onlineUsers } = useSocketContext();

  const isSelected = selectedConversation?._id === chatUser?._id;
  const isOnline = onlineUsers.includes(chatUser._id);

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
          alt="user"
          className="w-10 h-10 rounded-full object-cover"
        />

        {isOnline && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-black" />
        )}
      </div>

      <div className="flex flex-col">
        <h1 className="text-sm font-semibold">{chatUser?.fullName}</h1>
        <span className="text-xs text-gray-400">@{chatUser?.username}</span>
      </div>
    </div>
  );
}

export default Messageusers;