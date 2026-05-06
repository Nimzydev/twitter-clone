import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import useGetConversation from "../../zustand/useGetConversations";
import { useSocketContext } from "../context/SocketContext";

const useGetMessages = () => {
  const { selectedConversation, messages, setMessages } =
    useGetConversation();

  const { socket } = useSocketContext();

  // ✅ FETCH MESSAGES
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["messages", selectedConversation?._id],
    enabled: !!selectedConversation?._id,
    queryFn: async () => {
      const res = await fetch(
        `/api/message/allmessages/${selectedConversation._id}`
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      // ✅ ALWAYS return array
      return Array.isArray(data) ? data : [];
    },
  });

  // ✅ SET MESSAGES FROM API (SAFE)
  useEffect(() => {
    if (data) {
      setMessages(Array.isArray(data) ? data : []);
    }
  }, [data, setMessages]);

  // ✅ REAL-TIME SOCKET LISTENER (FIXED)
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      setMessages((prev) => {
        // ✅ ensure prev is always array
        if (!Array.isArray(prev)) return [newMessage];

        return [...prev, newMessage];
      });
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, setMessages]);

  return { messages, isLoading, refetch };
};

export default useGetMessages;