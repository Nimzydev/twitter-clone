import React, { useRef, useState, useCallback } from "react";
import { IoSend } from "react-icons/io5";
import { FaMicrophone, FaStop, FaPlus } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import useGetConversation from "../../../zustand/useGetConversations";
import toast from "react-hot-toast";

function Textinput() {
  const [message, setMessage] = useState("");
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);
  const recordingTimerRef = useRef(null);

  const { selectedConversation, setMessages } = useGetConversation();

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
            resolve(new File([blob], "photo.jpg", { type: "image/jpeg" }));
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

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;

    const isVideo = file.type.startsWith("video/");

    try {
      if (isVideo) {
        setMedia(file);
        setMediaType("video");
        setMediaPreview(URL.createObjectURL(file));
      } else {
        toast.loading("Processing image...", { id: "img-process" });
        const compressed = await compressImageToJpeg(file);
        toast.dismiss("img-process");

        setMedia(compressed);
        setMediaType("image");

        const reader = new FileReader();
        reader.onloadend = () => setMediaPreview(reader.result);
        reader.readAsDataURL(compressed);
      }
    } catch (err) {
      toast.dismiss("img-process");
      console.error(err);
      toast.error("Failed to process file. Please try again.");
    }
  };

  const handleCancelMedia = () => {
    setMedia(null);
    setMediaPreview(null);
    setMediaType(null);
  };

  const startRecording = useCallback(async () => {
    if (isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setRecordingDuration(0);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const audioFile = new File([audioBlob], "voice-note.webm", {
          type: "audio/webm",
        });
        setMedia(audioFile);
        setMediaType("audio");
        setMediaPreview(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(recordingTimerRef.current);
      };

      mediaRecorder.start();
      setIsRecording(true);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch {
      toast.error(
        "Microphone access denied. Please allow microphone access in your browser settings."
      );
    }
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
      setRecordingDuration(0);
    }
  }, [isRecording]);

  const formatDuration = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const handleSendMessage = async () => {
    if (!message.trim() && !media) return;

    try {
      const formData = new FormData();
      formData.append("text", message);
      if (media) formData.append("file", media);

      const res = await fetch(
        `/api/message/send/${selectedConversation._id}`,
        { method: "POST", body: formData }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessages((prev) => [...(prev || []), data]);

      useGetConversation.getState().setLastMessage(
        String(selectedConversation._id),
        {
          text: data.text || "",
          image: data.image || "",
          video: data.video || "",
          audio: data.audio || "",
          createdAt: data.createdAt || new Date().toISOString(),
        }
      );

      setMessage("");
      setMedia(null);
      setMediaPreview(null);
      setMediaType(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message");
    }
  };

  return (
    <div className="p-2 bg-black">

      {mediaPreview && (
        <div className="mb-3 relative inline-block">
          <button
            onClick={handleCancelMedia}
            className="absolute -top-2 -right-2 bg-black/80 hover:bg-black text-white rounded-full p-0.5 z-10"
          >
            <IoMdClose size={16} />
          </button>

          {mediaType === "audio" && (
            <audio controls src={mediaPreview} className="w-full max-w-xs" />
          )}
          {mediaType === "video" && (
            <video controls className="w-52 rounded-lg max-h-40">
              <source src={mediaPreview} />
            </video>
          )}
          {mediaType === "image" && (
            <img
              src={mediaPreview}
              className="w-24 h-24 object-cover rounded-lg"
              alt="preview"
            />
          )}
        </div>
      )}

      {isRecording && (
        <div className="flex items-center gap-2 mb-2 px-1">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-400 text-xs font-medium">
            Recording... {formatDuration(recordingDuration)}
          </span>
          <span className="text-gray-400 text-xs">Release to stop</span>
        </div>
      )}

      <div className="flex items-center gap-2">

        <button
          type="button"
          onClick={() => fileInputRef.current.click()}
          className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 text-white transition"
          title="Attach image or video"
        >
          <FaPlus size={14} />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          hidden
          onChange={handleFileSelect}
        />

        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 rounded-full bg-gray-900 text-white border border-gray-700 outline-none min-w-0"
        />

        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); startRecording(); }}
          onMouseUp={(e) => { e.preventDefault(); stopRecording(); }}
          onMouseLeave={() => { if (isRecording) stopRecording(); }}
          onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
          onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
          onContextMenu={(e) => e.preventDefault()}
          className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full transition select-none ${
            isRecording
              ? "bg-red-500 text-white scale-110"
              : "bg-gray-700 hover:bg-gray-600 text-white"
          }`}
          title="Hold to record voice message"
        >
          {isRecording ? <FaStop size={13} /> : <FaMicrophone size={14} />}
        </button>

        <button
          onClick={handleSendMessage}
          className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-blue-600 hover:bg-blue-700 transition rounded-full text-white"
        >
          <IoSend size={15} />
        </button>
      </div>
    </div>
  );
}

export default Textinput;