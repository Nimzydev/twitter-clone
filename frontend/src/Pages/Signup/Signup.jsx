import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { TailSpin } from "react-loader-spinner";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useQueryClient } from "@tanstack/react-query";

function Signup() {
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
  });

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: async ({ fullName, username, email, password }) => {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fullName, username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success("Account created successfully");
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutate(formData);
  };

  // Google sign up uses same endpoint as Google sign in —
  // if the account does not exist it creates one automatically
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Account created with Google");
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    } catch (err) {
      toast.error(err.message || "Google sign up failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="w-full max-w-md p-6 rounded-lg shadow-lg bg-gray-900">

        <div className="flex justify-center mb-6">
          <img src="/twitter.avif" alt="logo" className="w-16" />
        </div>

        <h1 className="text-2xl font-bold text-center mb-6">Sign Up</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            onChange={handleChange}
            type="text"
            name="fullName"
            value={formData.fullName}
            placeholder="Full Name"
            className="p-3 rounded bg-gray-800 border border-gray-700"
          />
          <input
            onChange={handleChange}
            type="text"
            name="username"
            value={formData.username}
            placeholder="Username"
            className="p-3 rounded bg-gray-800 border border-gray-700"
          />
          <input
            onChange={handleChange}
            type="email"
            name="email"
            value={formData.email}
            placeholder="Email"
            className="p-3 rounded bg-gray-800 border border-gray-700"
          />
          <input
            onChange={handleChange}
            type="password"
            name="password"
            value={formData.password}
            placeholder="Password"
            className="p-3 rounded bg-gray-800 border border-gray-700"
          />

          <button
            type="submit"
            disabled={isPending}
            className="bg-green-500 hover:bg-green-600 p-3 rounded font-semibold disabled:opacity-50"
          >
            {isPending ? <TailSpin width={20} height={20} /> : "Sign Up"}
          </button>

          {isError && (
            <p className="text-red-500 text-sm">{error.message}</p>
          )}
        </form>

        {/* Google Sign Up */}
        <div className="mt-4 flex flex-col items-center gap-3">
          <div className="flex items-center w-full gap-3">
            <div className="flex-1 h-px bg-gray-700" />
            <span className="text-gray-400 text-sm">or</span>
            <div className="flex-1 h-px bg-gray-700" />
          </div>

          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error("Google sign up failed")}
            theme="filled_black"
            shape="pill"
            text="signup_with"
          />
        </div>

        <p className="text-center mt-4">Already have an account?</p>

        <button
          onClick={() => navigate("/signin")}
          className="w-full mt-2 border border-gray-600 p-2 rounded hover:bg-gray-800"
        >
          Sign In
        </button>
      </div>
    </div>
  );
}

export default Signup;