import { useQueryClient } from "@tanstack/react-query";

import {
  useState,
  useEffect,
  createContext,
  useContext,
} from "react";

import io from "socket.io-client";

import useGetConversation from "../../zustand/useGetConversations";

export const SocketContext =
  createContext();

export const useSocketContext =
  () => useContext(SocketContext);

export const SocketContextProvider = ({
  children,
}) => {
  const [socket, setSocket] =
    useState(null);

  const [onlineUsers, setOnlineUsers] =
    useState([]);

  const [typingUsers, setTypingUsers] =
    useState([]);

  const queryClient = useQueryClient();

  const authUser =
    queryClient.getQueryData([
      "authUser",
    ]);

  const {
    selectedConversation,
    setMessages,
    setUnreadCounts,
  } = useGetConversation();

  useEffect(() => {
    if (!authUser?._id) return;

    const socketInstance = io(
      "http://localhost:5000",
      {
        query: {
          userId: authUser._id,
        },
      }
    );

    setSocket(socketInstance);

    socketInstance.on(
      "getOnlineUsers",
      setOnlineUsers
    );

    socketInstance.on(
      "typing",
      ({ senderId }) => {
        setTypingUsers((prev) => [
          ...new Set([
            ...prev,
            senderId,
          ]),
        ]);
      }
    );

    socketInstance.on(
      "stopTyping",
      ({ senderId }) => {
        setTypingUsers((prev) =>
          prev.filter(
            (id) => id !== senderId
          )
        );
      }
    );

    socketInstance.on(
      "newMessage",
      (msg) => {
        const senderId =
          msg.sender?.toString();

        const receiverId =
          msg.receiver?.toString();

        const currentChatId =
          selectedConversation?._id?.toString();

        // ✅ OPEN CHAT → append directly
        if (
          currentChatId &&
          senderId === currentChatId
        ) {
          setMessages((prev) => [
            ...(prev || []),
            msg,
          ]);

          return;
        }

        // ✅ ONLY increment if current user RECEIVED it
        if (
          receiverId ===
          authUser?._id?.toString()
        ) {
          setUnreadCounts((prev) => ({
            ...prev,
            [senderId]:
              (prev[senderId] || 0) + 1,
          }));
        }
      }
    );

    return () => {
      socketInstance.close();
    };
  }, [
    authUser?._id,
    selectedConversation,
  ]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
        typingUsers,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};