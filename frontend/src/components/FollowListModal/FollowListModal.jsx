import React from "react";
import { IoMdClose } from "react-icons/io";
import { useNavigate } from "react-router-dom";

function FollowListModal({
  isOpen,
  setIsOpen,
  title,
  users = [],
}) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="bg-black border border-gray-800 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">
            {title}
          </h2>

          <button
            onClick={() => setIsOpen(false)}
            className="text-white text-xl"
          >
            <IoMdClose />
          </button>
        </div>

        {/* USERS */}
        <div className="overflow-y-auto max-h-[70vh]">
          {users.length === 0 ? (
            <p className="text-center text-gray-400 py-6">
              No users found
            </p>
          ) : (
            users.map((user) => (
              <div
                key={user._id}
                onClick={() => {
                  navigate(`/profile/${user.username}`);
                  setIsOpen(false);
                }}
                className="flex items-center gap-3 p-4 border-b border-gray-900 hover:bg-gray-900 cursor-pointer transition"
              >
                <img
                  src={user.profilePic || "/avatar.jpg"}
                  alt="profile"
                  className="w-12 h-12 rounded-full object-cover"
                />

                <div className="flex flex-col">
                  <h3 className="text-white font-medium">
                    {user.fullName}
                  </h3>

                  <p className="text-gray-400 text-sm">
                    @{user.username}
                  </p>

                  {user.bio && (
                    <p className="text-gray-500 text-xs mt-1 line-clamp-1">
                      {user.bio}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default FollowListModal;