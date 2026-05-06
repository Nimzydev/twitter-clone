import React, { useState, useEffect } from "react";
import useUpdateProfileUser from "../../hooks/useUpdateUser";
import { TailSpin } from "react-loader-spinner";

function Editmodal({ authUser, isOpen, setIsOpen }) {
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    bio: "",
    password: "",
    newPassword: "",
  });

  const { updateProfile, isUpdatingProfile } = useUpdateProfileUser();

  useEffect(() => {
    if (authUser) {
      setForm({
        fullName: authUser.fullName || "",
        username: authUser.username || "",
        email: authUser.email || "",
        bio: authUser.bio || "",
        password: "",
        newPassword: "",
      });
    }
  }, [authUser]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateProfile(form);
    setIsOpen(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-3"
      onClick={() => setIsOpen(false)} // ✅ click outside closes modal
    >
      <div
        className="w-full max-w-lg bg-zinc-900 rounded-2xl p-5 border border-gray-800"
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
      >
        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-white text-lg font-semibold">
            Update Profile
          </h1>

          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white text-sm"
          >
            ✕
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">

          <div className="grid grid-cols-2 gap-2">
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Full Name"
              className="p-2 bg-black text-white rounded-lg border border-gray-700 outline-none text-sm"
            />

            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Username"
              className="p-2 bg-black text-white rounded-lg border border-gray-700 outline-none text-sm"
            />
          </div>

          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            className="p-2 bg-black text-white rounded-lg border border-gray-700 outline-none text-sm"
          />

          <input
            name="bio"
            value={form.bio}
            onChange={handleChange}
            placeholder="Bio"
            className="p-2 bg-black text-white rounded-lg border border-gray-700 outline-none text-sm"
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Current Password"
              className="p-2 bg-black text-white rounded-lg border border-gray-700 outline-none text-sm"
            />

            <input
              name="newPassword"
              type="password"
              value={form.newPassword}
              onChange={handleChange}
              placeholder="New Password"
              className="p-2 bg-black text-white rounded-lg border border-gray-700 outline-none text-sm"
            />
          </div>

          {/* BUTTONS */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-sm text-gray-300 hover:text-white"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-full text-sm"
            >
              {isUpdatingProfile ? (
                <TailSpin width={16} height={16} color="white" />
              ) : (
                "Save"
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default Editmodal;