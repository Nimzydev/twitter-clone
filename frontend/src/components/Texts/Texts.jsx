import React, { useEffect, useRef } from "react";
import useGetMessages from "../../hooks/useGetMessages";
import Text from "./Text";

function Texts() {
  const { messages, isLoading } = useGetMessages();
  const containerRef = useRef(null);

  useEffect(() => {
    if (!messages || messages.length === 0) return;

    const timer = setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [messages]);

  const safeMessages = Array.isArray(messages) ? messages : [];

  if (isLoading) {
    return (
      <div className="flex justify-center mt-4 text-gray-400 p-4">
        Loading messages...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-3 p-4 overflow-y-auto"
      style={{ height: "100%" }}
    >
      {safeMessages.length === 0 && (
        <p className="text-center text-gray-500 mt-4">No messages yet</p>
      )}

      {safeMessages.map((message) => (
        <Text key={message._id} message={message} />
      ))}
    </div>
  );
}

export default Texts;