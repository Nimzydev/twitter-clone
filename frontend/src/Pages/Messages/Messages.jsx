import React from "react";
import "./Messages.css";
import Messagepanel from "./Messagepanel";
import Messagecontainer from "./Messagecontainer";
import { useQuery } from "@tanstack/react-query";
import { TailSpin } from "react-loader-spinner";

function Messages() {
  const { data: followingUsers, isLoading: loadingFollowing } = useQuery({
    queryKey: ["chatUsers"],
    queryFn: async () => {
      const res = await fetch("/api/user/followingusers");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
  });

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

  const mergedUsers = React.useMemo(() => {
    const convMap = {};
    if (conversations) {
      conversations.forEach((conv) => {
        convMap[String(conv._id)] = conv;
      });
    }

    const userMap = {};

    // Add all following users
    if (followingUsers) {
      followingUsers.forEach((user) => {
        const id = String(user._id);
        userMap[id] = {
          ...user,
          lastMessage: convMap[id]?.lastMessage || null,
        };
      });
    }

    // Also add conversation users who may not be in following list
    // so messages from non-followed users still appear
    if (conversations) {
      conversations.forEach((conv) => {
        const id = String(conv._id);
        if (!userMap[id]) {
          userMap[id] = {
            _id: conv._id,
            fullName: conv.fullName,
            username: conv.username,
            profilePic: conv.profilePic,
            lastMessage: conv.lastMessage || null,
          };
        }
      });
    }

    return Object.values(userMap);
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