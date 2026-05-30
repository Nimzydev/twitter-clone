import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { TailSpin } from "react-loader-spinner";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

function Signin() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotPending, setForgotPending] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ── Regular login ──────────────────────────────────────────────────────
  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: async ({ username, password }) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success("Logged in successfully");
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutate(formData);
  };

  // ── Google login ───────────────────────────────────────────────────────
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
      toast.success("Signed in with Google");
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    } catch (err) {
      toast.error(err.message || "Google sign in failed");
    }
  };

  // ── Forgot password ────────────────────────────────────────────────────
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return toast.error("Please enter your email");

    setForgotPending(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      setShowForgot(false);
      setForgotEmail("");
    } catch (err) {
      toast.error(err.message || "Failed to send reset email");
    } finally {
      setForgotPending(false);
    }
  };

  // ── Forgot password form ───────────────────────────────────────────────
  if (showForgot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="w-full max-w-md p-6 rounded-lg shadow-lg bg-gray-900">

          <div className="flex justify-center mb-6">
            <img src="/twitter.avif" alt="logo" className="w-16" />
          </div>

          <h1 className="text-2xl font-bold text-center mb-2">
            Forgot Password
          </h1>
          <p className="text-gray-400 text-center text-sm mb-6">
            Enter your email and we will send you a reset link
          </p>

          <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Your email address"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              className="p-3 rounded bg-gray-800 border border-gray-700 outline-none"
              required
            />

            <button
              type="submit"
              disabled={forgotPending}
              className="bg-blue-500 hover:bg-blue-600 p-3 rounded font-semibold disabled:opacity-50 flex items-center justify-center"
            >
              {forgotPending ? (
                <TailSpin width={20} height={20} color="white" />
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>

          <button
            onClick={() => setShowForgot(false)}
            className="w-full mt-4 text-gray-400 hover:text-white text-sm text-center"
          >
            ← Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  // ── Normal sign in form ────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="w-full max-w-md p-6 rounded-lg shadow-lg bg-gray-900">

        <div className="flex justify-center mb-6">
          <img src="/twitter.avif" alt="logo" className="w-16" />
        </div>

        <h1 className="text-2xl font-bold text-center mb-6">Sign In</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            onChange={handleChange}
            type="text"
            name="username"
            value={formData.username}
            placeholder="Username"
            className="p-3 rounded bg-gray-800 border border-gray-700 outline-none"
          />

          <input
            onChange={handleChange}
            type="password"
            name="password"
            value={formData.password}
            placeholder="Password"
            className="p-3 rounded bg-gray-800 border border-gray-700 outline-none"
          />

          <button
            type="submit"
            disabled={isPending}
            className="bg-blue-500 hover:bg-blue-600 p-3 rounded font-semibold disabled:opacity-50"
          >
            {isPending ? <TailSpin width={20} height={20} /> : "Sign In"}
          </button>

          {isError && (
            <p className="text-red-500 text-sm">{error.message}</p>
          )}
        </form>

        {/* Google Sign In */}
        <div className="mt-4 flex flex-col items-center gap-3">
          <div className="flex items-center w-full gap-3">
            <div className="flex-1 h-px bg-gray-700" />
            <span className="text-gray-400 text-sm">or</span>
            <div className="flex-1 h-px bg-gray-700" />
          </div>

          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error("Google sign in failed")}
            theme="filled_black"
            shape="pill"
            text="signin_with"
          />
        </div>

        {/* Forgot password */}
        <button
          onClick={() => setShowForgot(true)}
          className="w-full mt-4 text-gray-400 hover:text-white text-sm text-center"
        >
          Forgot your password?
        </button>

        <p className="text-center mt-4">Don't have an account?</p>

        <button
          onClick={() => navigate("/signup")}
          className="w-full mt-2 border border-gray-600 p-2 rounded hover:bg-gray-800"
        >
          Sign Up
        </button>
      </div>
    </div>
  );
}

export default Signin;