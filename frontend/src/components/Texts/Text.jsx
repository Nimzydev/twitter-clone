import React from "react";
import "./Text.css";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import useGetConversation from "../../../zustand/useGetConversations.js";

function Text({ message }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const authUser = queryClient.getQueryData(["authUser"]);
  const { selectedConversation } = useGetConversation();

  const fromMe =
    message.sender?.toString() === authUser?._id?.toString();

  const profilePic = fromMe
    ? authUser?.profilePic
    : selectedConversation?.profilePic;

  // Username to navigate to when profile pic is clicked
  const username = fromMe
    ? authUser?.username
    : selectedConversation?.username;

  const handleProfileClick = () => {
    if (username) {
      navigate(`/profile/${username}`);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const time = formatTime(message.createdAt);

  return (
    <div
      className={`flex items-end gap-2 ${
        fromMe ? "justify-end" : "justify-start"
      }`}
    >
      {/* RECEIVER PROFILE PIC — left side, clickable */}
      {!fromMe && (
        <img
          onClick={handleProfileClick}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition"
          src={profilePic || "/avatar.jpg"}
          alt="profile"
          title={`View ${username}'s profile`}
        />
      )}

      {/* MESSAGE BUBBLE + TIMESTAMP */}
      <div
        className={`flex flex-col max-w-[75%] ${
          fromMe ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`px-4 py-2 rounded-2xl text-sm break-words ${
            fromMe
              ? "bg-blue-600 text-white rounded-br-sm"
              : "bg-gray-800 text-gray-100 rounded-bl-sm"
          }`}
        >
          {message.text && <p>{message.text}</p>}

          {message.image && (
            <img
              src={message.image}
              className="rounded-xl mt-2 max-w-full"
              alt="img"
            />
          )}

          {message.video && (
            <video controls className="rounded-xl mt-2 max-w-full">
              <source src={message.video} />
            </video>
          )}

          {message.audio && (
            <audio controls className="mt-2 w-full">
              <source src={message.audio} />
            </audio>
          )}
        </div>

        {/* TIMESTAMP */}
        {time && (
          <span className="text-[10px] text-gray-500 mt-1 px-1">
            {time}
          </span>
        )}
      </div>

      {/* SENDER PROFILE PIC — right side, clickable */}
      {fromMe && (
        <img
          onClick={handleProfileClick}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition"
          src={profilePic || "/avatar.jpg"}
          alt="profile"
          title="View your profile"
        />
      )}
    </div>
  );
}

export default Text;