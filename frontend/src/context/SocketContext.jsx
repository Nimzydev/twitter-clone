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

  // Hydrate unread counts from DB — called after socket connects
  // Uses setTimeout(0) to yield to React's paint cycle first
  // so all subscribers are mounted before setUnreadCounts fires
  const hydrateUnreadCounts = () => {
    setTimeout(() => {
      fetch("/api/message/unreadcounts", { credentials: "include" })
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then((dbCounts) => {
          if (typeof dbCounts !== "object" || Array.isArray(dbCounts)) return;
          console.log("📥 [UNREAD] Hydrated from DB:", dbCounts);
          // getState() is always current — never stale
          useGetConversation.getState().setUnreadCounts(dbCounts);
        })
        .catch((err) =>
          console.error("❌ Failed to hydrate unread counts:", err)
        );
    }, 0);
  };

  // Connect socket and hydrate when authUser becomes available
  useEffect(() => {
    let pollInterval = null;

    const tryConnect = () => {
      const user = queryClient.getQueryData(["authUser"]);
      if (!user?._id) return;

      const uid = String(user._id).trim();

      // Already connected for this user — do nothing
      if (connectedUidRef.current === uid) return;

      clearInterval(pollInterval);
      connectedUidRef.current = uid;
      authUserIdRef.current = uid;

      const s = connectSocket(uid);
      setSocket(s);

      // Hydrate unread counts for this user
      hydrateUnreadCounts();
    };

    tryConnect();
    pollInterval = setInterval(tryConnect, 200);

    return () => clearInterval(pollInterval);
  }, []);

  // Reset connectedUidRef when user logs out so next login re-connects
  useEffect(() => {
    const unsub = queryClient.getQueryCache().subscribe(() => {
      const user = queryClient.getQueryData(["authUser"]);
      if (user?._id) {
        const uid = String(user._id).trim();
        authUserIdRef.current = uid;

        // New user logged in — connect and hydrate
        if (connectedUidRef.current !== uid) {
          connectedUidRef.current = uid;
          const s = connectSocket(uid);
          setSocket(s);
          hydrateUnreadCounts();
        }
      } else {
        // Logged out — reset so next login triggers fresh connect + hydrate
        connectedUidRef.current = null;
        authUserIdRef.current = null;
      }
    });
    return () => unsub();
  }, [queryClient]);

  // newMessage handler
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

      console.log(`\n📨 [CONTEXT] newMessage`);
      console.log(`   senderId:   "${senderId}"`);
      console.log(`   receiverId: "${receiverId}"`);
      console.log(`   myId:       "${myId}"`);
      console.log(`   openChatId: "${openChatId}"`);

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

      // Chat open with sender — append message directly
      if (receiverId === myId && openChatId && senderId === openChatId) {
        console.log(`💬 Appending to open chat`);
        setMessagesRef.current((prev) => [...(prev || []), msg]);
        return;
      }

      // Chat not open — increment unread badge
      if (receiverId === myId) {
        console.log(`🔔 Incrementing unread for: ${senderId}`);
        useGetConversation.getState().setUnreadCounts((prev) => {
          const next = {
            ...prev,
            [senderId]: (prev[senderId] || 0) + 1,
          };
          console.log(`📊 unreadCounts:`, next);
          return next;
        });
      }
    };

    addSocketListener("newMessage", handleNewMessage);
    return () => removeSocketListener("newMessage", handleNewMessage);
  }, []);

  // newNotification handler
  useEffect(() => {
    const handleNewNotification = () => {
      console.log("🔔 [CONTEXT] newNotification — refreshing");
      queryClientRef.current.invalidateQueries({
        queryKey: ["notifications"],
      });
    };

    addSocketListener("newNotification", handleNewNotification);
    return () =>
      removeSocketListener("newNotification", handleNewNotification);
  }, []);

  // Online users + typing
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