import React, { useState } from "react";
import "./Rightpanel.css";
import { useQuery } from "@tanstack/react-query";
import { TailSpin } from "react-loader-spinner";
import { useNavigate } from "react-router-dom";

function Rightpanel() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const { data: users, isLoading } = useQuery({
    queryKey: ["searchUsers", search],
    queryFn: async () => {
      const res = await fetch(`/api/user/search?query=${search}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);
      return data;
    },
    enabled: !!search,
  });

  // ✅ ONLY ADD THIS FUNCTION
  const handleUserClick = (username) => {
    navigate(`/profile/${username}`);
    setSearch(""); // ✅ clears input after click
  };

  return (
    <div className="w-full px-4 py-3">

      {/* 🔍 SEARCH INPUT */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-black text-white border border-gray-700 rounded px-3 py-2 focus:outline-none"
        />
      </div>

      {/* ⏳ LOADING */}
      {isLoading && (
        <div className="flex justify-center">
          <TailSpin width={30} height={30} color="white" />
        </div>
      )}

      {/* ❌ NO RESULTS */}
      {!isLoading && search && users?.length === 0 && (
        <p className="text-gray-400 text-sm">No users found</p>
      )}

      {/* ✅ RESULTS */}
      {!isLoading && users && (
        <div className="flex flex-col gap-3">
          {users.map((user) => (
            <div
              key={user._id}
              onClick={() => handleUserClick(user.username)} // ✅ UPDATED
              className="flex items-center gap-3 cursor-pointer hover:bg-gray-900 p-2 rounded"
            >
              <img
                src={user.profilePic || "/avatar.jpg"}
                alt="user"
                className="w-10 h-10 rounded-full object-cover"
              />

              <div>
                <p className="text-white font-medium">
                  {user.fullname}
                </p>
                <p className="text-gray-400 text-sm">
                  @{user.username}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Rightpanel;