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
  getSocket,
} from "../socket/socketClient";
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
    setUnreadCounts,
    setLastMessage,
  } = useGetConversation();

  // Refs updated every render — socket callbacks always read current values
  const selectedConvRef = useRef(null);
  const authUserIdRef = useRef(null);
  const setMessagesRef = useRef(null);
  const setUnreadCountsRef = useRef(null);
  const setLastMessageRef = useRef(null);

  selectedConvRef.current = selectedConversation;
  setMessagesRef.current = setMessages;
  setUnreadCountsRef.current = setUnreadCounts;
  setLastMessageRef.current = setLastMessage;

  // Connect socket once authUser is ready
  useEffect(() => {
    let pollInterval = null;

    const tryConnect = () => {
      const user = queryClient.getQueryData(["authUser"]);
      if (user?._id) {
        clearInterval(pollInterval);
        const uid = String(user._id).trim();
        authUserIdRef.current = uid;
        const s = connectSocket(uid);
        setSocket(s);
      }
    };

    tryConnect();
    pollInterval = setInterval(tryConnect, 200);

    return () => clearInterval(pollInterval);
  }, []);

  // Keep authUserIdRef fresh when query cache updates
  useEffect(() => {
    const unsub = queryClient.getQueryCache().subscribe(() => {
      const user = queryClient.getQueryData(["authUser"]);
      if (user?._id) {
        authUserIdRef.current = String(user._id).trim();
      }
    });
    return () => unsub();
  }, [queryClient]);

  // newMessage handler — registered once, reads everything via refs
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

      console.log(`\n📨 [CONTEXT] newMessage handler fired`);
      console.log(`   senderId:   "${senderId}"`);
      console.log(`   receiverId: "${receiverId}"`);
      console.log(`   myId:       "${myId}"`);
      console.log(`   openChatId: "${openChatId}"`);
      console.log(`   iAmReceiver: ${receiverId === myId}`);
      console.log(`   chatOpen:    ${!!(openChatId && senderId === openChatId)}`);

      if (!myId || !senderId || !receiverId) {
        console.warn(`⚠️ Missing ID — skipping`);
        return;
      }

      // Update last message preview
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

      // Chat is open with sender — append to messages
      if (receiverId === myId && openChatId && senderId === openChatId) {
        console.log(`💬 Appending to open chat`);
        setMessagesRef.current((prev) => [...(prev || []), msg]);
        return;
      }

      // Chat not open — increment unread
      if (receiverId === myId) {
        console.log(`🔔 Incrementing unread for: ${senderId}`);
        setUnreadCountsRef.current((prev) => {
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