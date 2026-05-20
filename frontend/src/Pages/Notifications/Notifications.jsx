import React, { useState, useEffect } from "react";
import { IoSettingsOutline } from "react-icons/io5";
import Ncontainer from "./Ncontainer";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { TailSpin } from "react-loader-spinner";

function Notifications() {
  const [openSettings, setOpenSettings] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/allnotifications");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
  });

  useEffect(() => {
    const markRead = async () => {
      try {
        await fetch("/api/notifications/markread", { method: "PUT" });
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      } catch (error) {
        console.error(error);
      }
    };
    markRead();
  }, []);

  const { mutate: deleteNotifications } = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications/deleteall", {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
    },
    onSuccess: () => {
      toast.success("All notifications cleared");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const sortedNotifications = notifications
    ? [...notifications].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      )
    : [];

  return (
    <div className="w-full max-w-2xl mx-auto pb-20 md:pb-0">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h1 className="text-lg font-semibold text-white">Notifications</h1>

        <div className="relative">
          <IoSettingsOutline
            onClick={() => setOpenSettings(!openSettings)}
            className="cursor-pointer text-gray-400 hover:text-white"
            size={20}
          />
          {openSettings && (
            <div className="absolute right-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-10">
              <button
                onClick={() => {
                  deleteNotifications();
                  setOpenSettings(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-800 text-red-400"
              >
                Delete all notifications
              </button>
            </div>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-10">
          <TailSpin width={40} height={40} color="white" />
        </div>
      )}

      {!isLoading && sortedNotifications.length === 0 && (
        <div className="flex justify-center py-10">
          <p className="text-gray-400 text-sm">You have no notifications</p>
        </div>
      )}

      <div className="divide-y divide-gray-800">
        {sortedNotifications.map((notification) => (
          <Ncontainer
            key={notification._id}
            notification={notification}
          />
        ))}
      </div>
    </div>
  );
}

export default Notifications;