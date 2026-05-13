import React, { useEffect, useRef } from "react";
import useGetMessages from "../../hooks/useGetMessages";
import Text from "./Text";

function Texts() {
  const { messages, isLoading } = useGetMessages();

  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const safeMessages = Array.isArray(messages)
    ? messages
    : [];

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
        <p className="text-center text-gray-500">
          No messages yet
        </p>
      )}

      {safeMessages.map((message) => (
        <Text
          key={message._id}
          message={message}
        />
      ))}

      <div ref={bottomRef} />
    </div>
  );
}

export default Texts;