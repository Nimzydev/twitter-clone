import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, createContext, useContext } from "react";
import io from "socket.io-client";

// ✅ context creation
export const SocketContext = createContext();

// ✅ THIS is what you are missing / what is breaking
export const useSocketContext = () => {
  return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData(["authUser"]);

  useEffect(() => {
    if (!authUser?._id) return;

    const socketInstance = io("http://localhost:5000", {
      query: {
        userId: authUser._id,
      },
    });

    setSocket(socketInstance);

    socketInstance.on("getOnlineUsers", (users) => {
      setOnlineUsers(users);
    });

    socketInstance.on("typing", ({ senderId }) => {
      setTypingUsers((prev) => [...new Set([...prev, senderId])]);
    });

    socketInstance.on("stopTyping", ({ senderId }) => {
      setTypingUsers((prev) => prev.filter((id) => id !== senderId));
    });

    return () => socketInstance.close();
  }, [authUser?._id]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, typingUsers }}>
      {children}
    </SocketContext.Provider>
  );
};