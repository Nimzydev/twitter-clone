import React, { useState } from "react";
import useGetConversation from "../../../zustand/useGetConversations.js";

function Messagepanel({ chatUsers }) {
  const [search, setSearch] = useState("");

  const {
    selectedConversation,
    setSelectedConversation,
    unreadCounts,
    setUnreadCounts,
  } = useGetConversation();

  const filteredUsers = chatUsers?.filter((user) =>
    user.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectConversation = (user) => {
    setSelectedConversation(user);

    // ✅ FIXED: fully remove unread entry (not just set 0)
    setUnreadCounts((prev) => {
      const updated = { ...prev };
      delete updated[user._id];
      return updated;
    });
  };

  return (
    <div
      className={`w-full md:w-1/3 border-r border-gray-800 flex flex-col ${
        selectedConversation ? "hidden md:flex" : "flex"
      }`}
    >
      <div className="p-3 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white">
          Messages
        </h2>

        <input
          type="text"
          placeholder="Search followers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mt-2 px-3 py-2 rounded-lg bg-gray-900 text-white border border-gray-700"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredUsers?.map((user) => (
          <div
            key={user._id}
            onClick={() => handleSelectConversation(user)}
            className={`flex items-center justify-between gap-3 p-3 cursor-pointer hover:bg-gray-900 transition ${
              selectedConversation?._id === user._id
                ? "bg-gray-800"
                : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <img
                src={user.profilePic || "/avatar.jpg"}
                className="w-10 h-10 rounded-full object-cover"
              />

              <div>
                <p className="text-white font-medium">
                  {user.fullName}
                </p>

                <p className="text-gray-400 text-sm">
                  @{user.username}
                </p>
              </div>
            </div>

            {/* ✅ UNREAD BADGE FIXED */}
            {unreadCounts?.[user._id] > 0 && (
              <div className="min-w-[22px] h-[22px] rounded-full bg-red-500 flex items-center justify-center text-xs text-white font-bold px-1">
                {unreadCounts[user._id]}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Messagepanel;