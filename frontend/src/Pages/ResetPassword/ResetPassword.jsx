import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { TailSpin } from "react-loader-spinner";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirm) {
      return toast.error("Passwords do not match");
    }

    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    setIsPending(true);

    try {
      const res = await fetch(`/api/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      toast.success(data.message);

      setTimeout(() => navigate("/signin"), 2000);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
      <div className="w-full max-w-md p-6 rounded-lg shadow-lg bg-gray-900">

        <div className="flex justify-center mb-6">
          <img src="/twitter.avif" alt="logo" className="w-16" />
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">
          Reset Password
        </h1>
        <p className="text-gray-400 text-center text-sm mb-6">
          Enter your new password below
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 rounded bg-gray-800 border border-gray-700 outline-none"
            required
          />

          <input
            type="password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="p-3 rounded bg-gray-800 border border-gray-700 outline-none"
            required
          />

          <button
            type="submit"
            disabled={isPending}
            className="bg-blue-500 hover:bg-blue-600 p-3 rounded font-semibold disabled:opacity-50 flex items-center justify-center"
          >
            {isPending ? (
              <TailSpin width={20} height={20} color="white" />
            ) : (
              "Reset Password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;