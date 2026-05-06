import React, { useEffect, useRef } from "react";
import useGetMessages from "../../hooks/useGetMessages";

function Texts() {
  const { messages, isLoading } = useGetMessages();
  const bottomRef = useRef();

  // ✅ auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ VERY IMPORTANT FIX
  const safeMessages = Array.isArray(messages) ? messages : [];

  if (isLoading) {
    return (
      <div className="flex justify-center mt-4 text-gray-400">
        Loading messages...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 overflow-y-auto h-full">
      {safeMessages.length === 0 && (
        <p className="text-center text-gray-500">No messages yet</p>
      )}

      {safeMessages.map((msg) => (
        <div
          key={msg._id}
          className={`max-w-[70%] px-4 py-2 rounded-xl text-sm ${
            msg.sender === msg.receiver
              ? "bg-gray-700 self-end"
              : "bg-blue-600 self-start"
          }`}
        >
          {msg.text}
        </div>
      ))}

      {/* ✅ scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
}

export default Texts;