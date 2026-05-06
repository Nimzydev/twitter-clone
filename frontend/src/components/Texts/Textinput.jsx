import React, { useState } from "react";
import { IoSend } from "react-icons/io5";
import { useSocketContext } from "../../context/SocketContext";
import useGetConversation from "../../../zustand/useGetConversations";
import { useQueryClient } from "@tanstack/react-query";

function Textinput() {
  const [message, setMessage] = useState("");

  const { socket } = useSocketContext();
  const { selectedConversation, setMessages } = useGetConversation();
  const queryClient = useQueryClient();

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedConversation) return;

    try {
      const res = await fetch(
        `/api/message/send/${selectedConversation._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: message,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // ✅ INSTANT UI UPDATE (THIS WAS MISSING)
      setMessages((prev) => [...prev, data]);

      // ✅ SOCKET (optional but good)
      if (socket) {
        socket.emit("sendMessage", {
          senderId: data.sender,
          receiverId: selectedConversation._id,
          message: data,
        });
      }

      setMessage("");

      // optional (can keep)
      queryClient.invalidateQueries({
        queryKey: ["messages", selectedConversation._id],
      });

    } catch (error) {
      console.error("Send message error:", error.message);
    }
  };

  return (
    <div className="flex items-center gap-2 w-full p-2 border-t border-gray-700 bg-black">
      <input
        type="text"
        placeholder="Type a message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="flex-1 px-4 py-2 rounded-full bg-gray-900 text-white outline-none border border-gray-700 focus:border-gray-500"
      />

      <button
        onClick={handleSendMessage}
        className="bg-blue-600 p-2 rounded-full hover:bg-blue-700 transition"
      >
        <IoSend size={18} />
      </button>
    </div>
  );
}

export default Textinput;