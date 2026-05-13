import { GiConversation } from "react-icons/gi";

import { useQueryClient } from "@tanstack/react-query";

import { useSocketContext } from "../../context/SocketContext";

import useGetConversation from "../../../zustand/useGetConversations";

import { useEffect } from "react";

import Texts from "../../components/Texts/Texts";

import Textinput from "../../components/Texts/Textinput";

function Messagecontainer() {
  const {
    selectedConversation,
    setSelectedConversation,
    setUnreadCounts,
  } = useGetConversation();

  const queryClient = useQueryClient();

  const { typingUsers } =
    useSocketContext();

  const isTyping =
    selectedConversation &&
    typingUsers.includes(
      selectedConversation._id
    );

  useEffect(() => {
    const markRead = async () => {
      if (!selectedConversation) return;

      try {
        await fetch(
          `/api/message/markread/${selectedConversation._id}`,
          {
            method: "PUT",
          }
        );

        // ✅ instantly clear unread count
        setUnreadCounts((prev) => ({
          ...prev,
          [selectedConversation._id]: 0,
        }));

        queryClient.invalidateQueries({
          queryKey: ["chatUsers"],
        });
      } catch (error) {
        console.error(error);
      }
    };

    markRead();
  }, [selectedConversation]);

  const handleDeleteConversation =
    async () => {
      if (!selectedConversation) return;

      const confirmDelete =
        window.confirm(
          "Delete this conversation?"
        );

      if (!confirmDelete) return;

      try {
        const res = await fetch(
          `/api/message/delete/${selectedConversation._id}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error);
        }

        setSelectedConversation(null);

        queryClient.invalidateQueries({
          queryKey: ["chatUsers"],
        });

        queryClient.invalidateQueries({
          queryKey: ["messages"],
        });
      } catch (error) {
        console.error(error);
      }
    };

  return (
    <div
      className={`flex-1 flex flex-col h-screen
      ${
        !selectedConversation
          ? "hidden md:flex"
          : "flex"
      }`}
    >
      {!selectedConversation && (
        <NoSelectedChat />
      )}

      {selectedConversation && (
        <>
          <div className="flex items-center justify-between p-3 border-b border-gray-800">
            <button
              className="md:hidden text-white text-lg"
              onClick={() =>
                setSelectedConversation(null)
              }
            >
              ←
            </button>

            <p className="text-white font-semibold">
              {
                selectedConversation.fullName
              }
            </p>

            <button
              onClick={
                handleDeleteConversation
              }
              className="text-xs px-3 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </button>
          </div>

          {isTyping && (
            <p className="text-sm text-gray-400 px-3 py-1">
              typing...
            </p>
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

const NoSelectedChat = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-400">
      <GiConversation size={50} />
      <p>Select a conversation</p>
    </div>
  );
};

export default Messagecontainer;