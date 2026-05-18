import React, { useEffect, useRef } from "react";
import useGetMessages from "../../hooks/useGetMessages";
import Text from "./Text";

function Texts() {
  const { messages, isLoading } = useGetMessages();
  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  // Scroll to bottom whenever messages change
  // Uses scrollTop on the container instead of scrollIntoView
  // which is more reliable when images/media are still loading
  useEffect(() => {
    if (!messages || messages.length === 0) return;

    // Small timeout to allow the DOM to finish rendering
    // all message bubbles before calculating scroll position
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
      <div className="flex justify-center mt-4 text-gray-400">
        Loading messages...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-3 p-4 overflow-y-auto h-full"
    >
      {safeMessages.length === 0 && (
        <p className="text-center text-gray-500">No messages yet</p>
      )}

      {safeMessages.map((message) => (
        <Text key={message._id} message={message} />
      ))}

      {/* Invisible anchor at the bottom */}
      <div ref={bottomRef} />
    </div>
  );
}

export default Texts;