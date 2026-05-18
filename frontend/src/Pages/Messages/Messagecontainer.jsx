import { GiConversation } from "react-icons/gi";
import { useQueryClient } from "@tanstack/react-query";
import { useSocketContext } from "../../context/SocketContext";
import useGetConversation from "../../../zustand/useGetConversations";
import { useEffect, useRef } from "react";
import Texts from "../../components/Texts/Texts";
import Textinput from "../../components/Texts/Textinput";

function Messagecontainer() {
  const {
    selectedConversation,
    setSelectedConversation,
    setUnreadCounts,
  } = useGetConversation();

  const queryClient = useQueryClient();
  const { typingUsers } = useSocketContext();

  const isTyping =
    selectedConversation &&
    typingUsers.includes(selectedConversation._id);

  const lastMarkedRef = useRef(null);

  useEffect(() => {
    if (!selectedConversation?._id) return;

    const convId = String(selectedConversation._id).trim();

    if (lastMarkedRef.current === convId) return;
    lastMarkedRef.current = convId;

    const markReadAndRefresh = async () => {
      try {
        // Mark this conversation as read in DB
        await fetch(`/api/message/markread/${convId}`, {
          method: "PUT",
          credentials: "include",
        });

        // Re-fetch fresh counts from DB — no filtering, raw DB counts
        const res = await fetch("/api/message/unreadcounts", {
          credentials: "include",
        });
        const dbCounts = await res.json();

        if (typeof dbCounts === "object" && !Array.isArray(dbCounts)) {
          console.log("✅ [MARKREAD] Fresh DB counts:", dbCounts);
          setUnreadCounts(dbCounts);
        }
      } catch (error) {
        console.error("Failed to mark read:", error);
        setUnreadCounts((prev) => {
          const updated = { ...prev };
          delete updated[convId];
          return updated;
        });
      }
    };

    markReadAndRefresh();
  }, [selectedConversation?._id]);

  const handleDeleteConversation = async () => {
    if (!selectedConversation) return;
    if (!window.confirm("Delete this conversation?")) return;

    try {
      const res = await fetch(
        `/api/message/delete/${selectedConversation._id}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSelectedConversation(null);
      lastMarkedRef.current = null;
      queryClient.invalidateQueries({ queryKey: ["chatUsers"] });
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div
      className={`flex-1 flex flex-col h-screen ${
        !selectedConversation ? "hidden md:flex" : "flex"
      }`}
    >
      {!selectedConversation && (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <GiConversation size={50} />
          <p>Select a conversation</p>
        </div>
      )}

      {selectedConversation && (
        <>
          <div className="flex items-center justify-between p-3 border-b border-gray-800">
            <button
              className="md:hidden text-white text-lg"
              onClick={() => {
                setSelectedConversation(null);
                lastMarkedRef.current = null;
              }}
            >
              ←
            </button>
            <p className="text-white font-semibold">
              {selectedConversation.fullName}
            </p>
            <button
              onClick={handleDeleteConversation}
              className="text-xs px-3 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </button>
          </div>

          {isTyping && (
            <p className="text-sm text-gray-400 px-3 py-1">typing...</p>
          )}

          <div className="flex-1 overflow-y-auto">
            <Texts />
          </div>

          <div className="border-t border-gray-800 p-2">
            <Textinput />
          </div>
        </>
      )}
    </div>
  );
}

export default Messagecontainer;