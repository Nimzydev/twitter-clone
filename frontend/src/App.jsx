import React from "react";
import Sidebar from "./components/Sidebar/Sidebar";
import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./Pages/Home/Home";
import Rightpanel from "./components/Rightpanel/Rightpanel";
import Profile from "./Pages/Profile/Profile";
import Notifications from "./Pages/Notifications/Notifications";
import Messages from "./Pages/Messages/Messages";
import Signin from "./Pages/Signin/Signin";
import Signup from "./Pages/Signup/Signup";
import { Toaster } from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import { TailSpin } from "react-loader-spinner";
import MobileNavbar from "./components/MobileNavBar/MobileNavBar";
import MobileSearch from "./components/Mobilesearch/MobileSearch";

function App() {
  const { data: authUser, isLoading } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (res.status === 304) return null;

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!res.ok) return null;

      return data;
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="app-spinner">
        <TailSpin visible={true} color="gold" width="100" height="100" />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-black text-white">

      {/* Toaster must be rendered here for toasts to appear anywhere in the app */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#1f2937",
            color: "#fff",
            border: "1px solid #374151",
          },
          success: {
            iconTheme: {
              primary: "#22c55e",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />

      {/* Sidebar */}
      {authUser && (
        <div className="hidden md:block">
          <Sidebar />
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center">
        {authUser && <MobileSearch />}
        <div className="w-full max-w-2xl border-x border-gray-700">
          <Routes>
            <Route path="/" element={authUser ? <Home /> : <Navigate to="/signin" />} />
            <Route path="/signin" element={!authUser ? <Signin /> : <Navigate to="/" />} />
            <Route path="/signup" element={!authUser ? <Signup /> : <Navigate to="/" />} />
            <Route path="/profile/:username" element={authUser ? <Profile /> : <Navigate to="/signin" />} />
            <Route path="/notifications" element={authUser ? <Notifications /> : <Navigate to="/signin" />} />
            <Route path="/messages" element={authUser ? <Messages /> : <Navigate to="/signin" />} />
          </Routes>
        </div>
      </main>

      {/* Right panel */}
      {authUser && (
        <div className="hidden lg:block">
          <Rightpanel />
        </div>
      )}

      <MobileNavbar />
    </div>
  );
}

export default App;