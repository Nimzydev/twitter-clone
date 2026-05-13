import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import useGetConversation from "../../zustand/useGetConversations";

const useGetMessages = () => {
  const {
    selectedConversation,
    messages,
    setMessages,
  } = useGetConversation();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["messages", selectedConversation?._id],

    enabled: !!selectedConversation?._id,

    queryFn: async () => {
      const res = await fetch(
        `/api/message/allmessages/${selectedConversation._id}`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      return Array.isArray(data) ? data : [];
    },
  });

  useEffect(() => {
    if (data) {
      setMessages(
        Array.isArray(data) ? data : []
      );
    }
  }, [data, setMessages]);

  return {
    messages,
    isLoading,
    refetch,
  };
};

export default useGetMessages;