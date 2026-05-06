import React, { useRef, useState } from "react";
import { IoMdClose } from "react-icons/io";
import { FaImage } from "react-icons/fa";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TailSpin } from "react-loader-spinner";

function Createpost() {
  const [text, setText] = useState("");
  const [img, setImg] = useState("");
  const imgRef = useRef(null);

  const postClient = useQueryClient();

  // ✅ GET AUTH USER (ONLY ADDITION)
  const authUser = postClient.getQueryData(["authUser"]);

  const handleImg = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setImg(reader.result);
    reader.readAsDataURL(file);
  };

  const { mutate: createPost, isPending, isError, error } = useMutation({
    mutationFn: async ({ text, img }) => {
      const res = await fetch("/api/post/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, img }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      setText("");
      setImg("");
      toast.success("Post created!");
      postClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createPost({ text, img });
  };

  return (
    <div className="border-b border-gray-800 px-4 py-4 bg-black">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">

        {/* TOP INPUT */}
        <div className="flex gap-3">
          <img
            src={authUser?.profilePic || "/avatar.jpg"}  // ✅ ONLY CHANGE HERE
            className="w-10 h-10 rounded-full object-cover"
            alt="avatar"
          />

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's happening?"
            className="w-full bg-transparent text-white resize-none outline-none text-sm md:text-base placeholder-gray-500 min-h-[60px]"
          />
        </div>

        {/* IMAGE PREVIEW */}
        {img && (
          <div className="relative rounded-xl overflow-hidden border border-gray-800">
            <IoMdClose
              onClick={() => {
                setImg("");
                imgRef.current.value = null;
              }}
              className="absolute top-2 right-2 text-white bg-black/60 rounded-full w-6 h-6 cursor-pointer"
            />

            <img
              src={img}
              className="w-full max-h-[300px] object-cover"
              alt="preview"
            />
          </div>
        )}

        {/* FOOTER */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <input
              type="file"
              hidden
              ref={imgRef}
              accept="image/*"
              onChange={handleImg}
            />

            <FaImage
              onClick={() => imgRef.current.click()}
              className="text-blue-400 text-lg cursor-pointer hover:text-blue-300"
            />
          </div>

          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-1.5 rounded-full text-sm font-semibold disabled:opacity-50"
            disabled={isPending}
          >
            {isPending ? (
              <TailSpin width={18} height={18} color="white" />
            ) : (
              "Post"
            )}
          </button>
        </div>

        {/* ERROR */}
        {isError && (
          <p className="text-red-500 text-sm">{error.message}</p>
        )}
      </form>
    </div>
  );
}

export default Createpost;