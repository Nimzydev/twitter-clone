import React from "react";

import "./Text.css";

import { useQueryClient } from "@tanstack/react-query";

import useGetConversation from "../../../zustand/useGetConversations.js";

function Text({ message }) {
  const queryClient = useQueryClient();

  const authUser =
    queryClient.getQueryData([
      "authUser",
    ]);

  const { selectedConversation } =
    useGetConversation();

  const fromMe =
    message.sender.toString() ===
    authUser?._id?.toString();

  const profilePic = fromMe
    ? authUser?.profilePic
    : selectedConversation?.profilePic;

  return (
    <div
      className={`flex items-end gap-2 ${
        fromMe
          ? "justify-end"
          : "justify-start"
      }`}
    >
      {!fromMe && (
        <img
          className="w-8 h-8 rounded-full object-cover"
          src={
            profilePic ||
            "/avatar.jpg"
          }
          alt="profile"
        />
      )}

      <div
        className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm break-words ${
          fromMe
            ? "bg-blue-600 text-white rounded-br-sm"
            : "bg-gray-800 text-gray-100 rounded-bl-sm"
        }`}
      >
        {message.text && (
          <p>{message.text}</p>
        )}

        {message.image && (
          <img
            src={message.image}
            className="rounded-xl mt-2 max-w-full"
          />
        )}

        {message.video && (
          <video
            controls
            className="rounded-xl mt-2 max-w-full"
          >
            <source
              src={message.video}
            />
          </video>
        )}

        {message.audio && (
          <audio
            controls
            className="mt-2 w-full"
          >
            <source
              src={message.audio}
            />
          </audio>
        )}
      </div>

      {fromMe && (
        <img
          className="w-8 h-8 rounded-full object-cover"
          src={
            profilePic ||
            "/avatar.jpg"
          }
          alt="profile"
        />
      )}
    </div>
  );
}

export default Text;