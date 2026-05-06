import React, { useState } from "react";
import useGetConversation from "../../../zustand/useGetConversations";

function Messagepanel({ chatUsers }) {
  const [search, setSearch] = useState("");
  const { selectedConversation, setSelectedConversation } =
    useGetConversation();

  // ✅ filter users safely
  const filteredUsers = chatUsers?.filter((user) =>
    user.fullName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className={`w-full md:w-1/3 border-r border-gray-800 flex flex-col 
      ${selectedConversation ? "hidden md:flex" : "flex"}`}
    >
      {/* HEADER */}
      <div className="p-3 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white">Messages</h2>

        {/* ✅ FIXED SEARCH INPUT */}
        <input
          type="text"
          placeholder="Search followers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mt-2 px-3 py-2 rounded-lg 
                     bg-gray-900 text-white placeholder-gray-400
                     border border-gray-700 
                     focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* USERS LIST */}
      <div className="flex-1 overflow-y-auto">
        {filteredUsers?.length === 0 && (
          <p className="text-gray-400 text-center mt-4">
            No users found
          </p>
        )}

        {filteredUsers?.map((user) => (
          <div
            key={user._id}
            onClick={() => setSelectedConversation(user)}
            className={`flex items-center gap-3 p-3 cursor-pointer 
              hover:bg-gray-900 transition 
              ${
                selectedConversation?._id === user._id
                  ? "bg-gray-800"
                  : ""
              }`}
          >
            {/* ✅ FIXED PROFILE IMAGE SIZE */}
            <img
              src={user.profilePic || "/avatar.jpg"}
              alt="user"
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
        ))}
      </div>
    </div>
  );
}

export default Messagepanel;