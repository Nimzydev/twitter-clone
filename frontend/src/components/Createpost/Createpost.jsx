import React, { useRef, useState } from "react";
import { IoMdClose } from "react-icons/io";
import { FaImage } from "react-icons/fa";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TailSpin } from "react-loader-spinner";

function Createpost() {
  const [text, setText] = useState("");
  const [imgPreview, setImgPreview] = useState("");
  const [imgFile, setImgFile] = useState(null);
  const imgRef = useRef(null);

  const postClient = useQueryClient();
  const authUser = postClient.getQueryData(["authUser"]);

  const compressImageToJpeg = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        const MAX = 1200;
        let { width, height } = img;

        if (width > MAX || height > MAX) {
          if (width > height) {
            height = Math.round((height * MAX) / width);
            width = MAX;
          } else {
            width = Math.round((width * MAX) / height);
            height = MAX;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            const compressed = new File([blob], "photo.jpg", {
              type: "image/jpeg",
            });
            resolve(compressed);
          },
          "image/jpeg",
          0.85
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };

      img.src = url;
    });
  };

  const handleImg = async (e) => {
    const file = e.target.files?.[0];

    // Reset input so same file can be re-selected
    if (imgRef.current) imgRef.current.value = "";

    if (!file) return;

    try {
      toast.loading("Processing image...", { id: "img-process" });

      // Use canvas compression which works for ALL file types on iOS:
      // JPEG, PNG, HEIC, HEIF, and live camera photos
      const compressed = await compressImageToJpeg(file);

      toast.dismiss("img-process");

      setImgFile(compressed);

      const reader = new FileReader();
      reader.onloadend = () => setImgPreview(reader.result);
      reader.readAsDataURL(compressed);
    } catch (err) {
      toast.dismiss("img-process");
      console.error(err);
      toast.error("Failed to process image. Please try again.");
    }
  };

  const { mutate: createPost, isPending, isError, error } = useMutation({
    mutationFn: async ({ text, imgFile }) => {
      const formData = new FormData();
      formData.append("text", text);
      if (imgFile) formData.append("img", imgFile);

      const res = await fetch("/api/post/create", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create post");
      return data;
    },
    onSuccess: () => {
      setText("");
      setImgPreview("");
      setImgFile(null);
      toast.success("Post created!");
      postClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() && !imgFile) {
      return toast.error("Please add text or an image");
    }
    createPost({ text, imgFile });
  };

  return (
    <div className="border-b border-gray-800 px-4 py-4 bg-black">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">

        <div className="flex gap-3">
          <img
            src={authUser?.profilePic || "/avatar.jpg"}
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

        {imgPreview && (
          <div className="relative rounded-xl overflow-hidden border border-gray-800">
            <IoMdClose
              onClick={() => {
                setImgPreview("");
                setImgFile(null);
              }}
              className="absolute top-2 right-2 text-white bg-black/60 rounded-full w-6 h-6 cursor-pointer z-10"
            />
            <img
              src={imgPreview}
              className="w-full max-h-[300px] object-cover"
              alt="preview"
            />
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div>
            <input
              type="file"
              hidden
              ref={imgRef}
              onChange={handleImg}
            />
            <FaImage
              onClick={() => imgRef.current.click()}
              className="text-blue-400 text-lg cursor-pointer hover:text-blue-300"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-1.5 rounded-full text-sm font-semibold disabled:opacity-50 flex items-center justify-center min-w-[90px]"
          >
            {isPending ? (
              <TailSpin width={18} height={18} color="white" />
            ) : (
              "Post"
            )}
          </button>
        </div>

        {isError && (
          <p className="text-red-500 text-sm">{error.message}</p>
        )}
      </form>
    </div>
  );
}

export default Createpost;