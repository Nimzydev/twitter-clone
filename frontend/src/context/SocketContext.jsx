import {
  useState,
  useEffect,
  createContext,
  useContext,
  useRef,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  connectSocket,
  addSocketListener,
  removeSocketListener,
} from "../../src/socket/socketClient";
import useGetConversation from "../../zustand/useGetConversations";

export const SocketContext = createContext();
export const useSocketContext = () => useContext(SocketContext);

export const SocketContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  const queryClient = useQueryClient();

  const {
    selectedConversation,
    setMessages,
    setLastMessage,
  } = useGetConversation();

  const selectedConvRef = useRef(null);
  const authUserIdRef = useRef(null);
  const setMessagesRef = useRef(null);
  const setLastMessageRef = useRef(null);
  const queryClientRef = useRef(queryClient);
  const connectedUidRef = useRef(null);

  selectedConvRef.current = selectedConversation;
  setMessagesRef.current = setMessages;
  setLastMessageRef.current = setLastMessage;
  queryClientRef.current = queryClient;

  const hydrateUnreadCounts = () => {
    setTimeout(() => {
      fetch("/api/message/unreadcounts", { credentials: "include" })
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then((dbCounts) => {
          if (typeof dbCounts !== "object" || Array.isArray(dbCounts)) return;
          useGetConversation.getState().setUnreadCounts(dbCounts);
        })
        .catch((err) =>
          console.error("❌ Failed to hydrate unread counts:", err)
        );
    }, 0);
  };

  useEffect(() => {
    let pollInterval = null;

    const tryConnect = () => {
      const user = queryClient.getQueryData(["authUser"]);
      if (!user?._id) return;

      const uid = String(user._id).trim();

      if (connectedUidRef.current === uid) return;

      clearInterval(pollInterval);
      connectedUidRef.current = uid;
      authUserIdRef.current = uid;

      const s = connectSocket(uid);
      setSocket(s);

      hydrateUnreadCounts();
    };

    tryConnect();
    pollInterval = setInterval(tryConnect, 200);

    return () => clearInterval(pollInterval);
  }, []);

  useEffect(() => {
    const unsub = queryClient.getQueryCache().subscribe(() => {
      const user = queryClient.getQueryData(["authUser"]);
      if (user?._id) {
        const uid = String(user._id).trim();
        authUserIdRef.current = uid;

        if (connectedUidRef.current !== uid) {
          connectedUidRef.current = uid;
          const s = connectSocket(uid);
          setSocket(s);
          hydrateUnreadCounts();
        }
      } else {
        connectedUidRef.current = null;
        authUserIdRef.current = null;
      }
    });
    return () => unsub();
  }, [queryClient]);

  useEffect(() => {
    const handleNewMessage = (msg) => {
      const senderId = msg.sender
        ? String(msg.sender._id ?? msg.sender).trim()
        : null;
      const receiverId = msg.receiver
        ? String(msg.receiver._id ?? msg.receiver).trim()
        : null;

      const myId = authUserIdRef.current;
      const openChatId = selectedConvRef.current?._id
        ? String(selectedConvRef.current._id).trim()
        : null;

      if (!myId || !senderId || !receiverId) return;

      if (receiverId === myId) {
        setLastMessageRef.current(senderId, {
          text: msg.text || "",
          image: msg.image || "",
          video: msg.video || "",
          audio: msg.audio || "",
          createdAt: msg.createdAt || new Date().toISOString(),
        });
      }

      if (senderId === myId) {
        setLastMessageRef.current(receiverId, {
          text: msg.text || "",
          image: msg.image || "",
          video: msg.video || "",
          audio: msg.audio || "",
          createdAt: msg.createdAt || new Date().toISOString(),
        });
      }

      if (receiverId === myId && openChatId && senderId === openChatId) {
        setMessagesRef.current((prev) => [...(prev || []), msg]);
        return;
      }

      if (receiverId === myId) {
        useGetConversation.getState().setUnreadCounts((prev) => {
          const next = {
            ...prev,
            [senderId]: (prev[senderId] || 0) + 1,
          };
          return next;
        });
      }
    };

    addSocketListener("newMessage", handleNewMessage);
    return () => removeSocketListener("newMessage", handleNewMessage);
  }, []);

  useEffect(() => {
    const handleNewNotification = () => {
      queryClientRef.current.invalidateQueries({
        queryKey: ["notifications"],
      });
    };

    addSocketListener("newNotification", handleNewNotification);
    return () =>
      removeSocketListener("newNotification", handleNewNotification);
  }, []);

  useEffect(() => {
    const onOnline = (users) => setOnlineUsers(users);
    const onTyping = ({ senderId }) =>
      setTypingUsers((p) => [...new Set([...p, senderId])]);
    const onStopTyping = ({ senderId }) =>
      setTypingUsers((p) => p.filter((id) => id !== senderId));

    addSocketListener("onlineUsers", onOnline);
    addSocketListener("typing", onTyping);
    addSocketListener("stopTyping", onStopTyping);

    return () => {
      removeSocketListener("onlineUsers", onOnline);
      removeSocketListener("typing", onTyping);
      removeSocketListener("stopTyping", onStopTyping);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, typingUsers }}>
      {children}
    </SocketContext.Provider>
  );
};