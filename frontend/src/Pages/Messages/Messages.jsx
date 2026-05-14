import React from "react";
import "./Messages.css";
import Messagepanel from "./Messagepanel";
import Messagecontainer from "./Messagecontainer";
import { useQuery } from "@tanstack/react-query";
import { TailSpin } from "react-loader-spinner";

function Messages() {
  // All users you follow (for starting new conversations)
  const { data: followingUsers, isLoading: loadingFollowing } = useQuery({
    queryKey: ["chatUsers"],
    queryFn: async () => {
      const res = await fetch("/api/user/followingusers");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
  });

  // Existing conversations with last message data
  const { data: conversations, isLoading: loadingConversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await fetch("/api/message/getusers");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
  });

  const isLoading = loadingFollowing || loadingConversations;

  // Merge: start with conversation users (they have lastMessage),
  // then append any following users who don't have a conversation yet
  const mergedUsers = React.useMemo(() => {
    if (!followingUsers) return [];

    const convMap = {};
    if (conversations) {
      conversations.forEach((conv) => {
        convMap[conv._id] = conv;
      });
    }

    return followingUsers.map((user) => {
      if (convMap[user._id]) {
        // Enrich with lastMessage and createdAt from conversation
        return {
          ...user,
          lastMessage: convMap[user._id].lastMessage || null,
        };
      }
      return { ...user, lastMessage: null };
    });
  }, [followingUsers, conversations]);

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {isLoading && (
        <TailSpin width={50} height={40} color="gold" />
      )}

      {!isLoading && (
        <>
          <Messagepanel chatUsers={mergedUsers} />
          <Messagecontainer />
        </>
      )}
    </div>
  );
}

export default Messages;