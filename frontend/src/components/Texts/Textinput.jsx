import React, { useRef, useState } from "react";
import { IoSend } from "react-icons/io5";
import { FaImage, FaMicrophone, FaStop, FaVideo } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import useGetConversation from "../../../zustand/useGetConversations";

function Textinput() {
  const [message, setMessage] = useState("");
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const { selectedConversation, setMessages } = useGetConversation();

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMedia(file);
    const reader = new FileReader();
    reader.onload = () => setMediaPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMedia(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const handleCancelMedia = () => {
    setMedia(null);
    setMediaPreview(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

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
        setMediaPreview(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Microphone access denied:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
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

      // Update last message preview instantly for sender
      const receiverId = String(selectedConversation._id);
      useGetConversation.getState().setLastMessage(receiverId, {
        text: data.text || "",
        image: data.image || "",
        video: data.video || "",
        audio: data.audio || "",
        createdAt: data.createdAt || new Date().toISOString(),
      });

      setMessage("");
      setMedia(null);
      setMediaPreview(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
      if (videoInputRef.current) videoInputRef.current.value = "";
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-2 border-t border-gray-800 bg-black">

      {/* MEDIA PREVIEW */}
      {mediaPreview && (
        <div className="mb-3 relative inline-block">
          <button
            onClick={handleCancelMedia}
            className="absolute -top-2 -right-2 bg-black/80 hover:bg-black text-white rounded-full p-0.5 z-10"
            title="Cancel"
          >
            <IoMdClose size={16} />
          </button>

          {media?.type?.startsWith("audio") && (
            <audio controls src={mediaPreview} className="w-full" />
          )}
          {media?.type?.startsWith("video") && (
            <video controls className="w-52 rounded-lg">
              <source src={mediaPreview} />
            </video>
          )}
          {media?.type?.startsWith("image") && (
            <img
              src={mediaPreview}
              className="w-24 h-24 object-cover rounded-lg"
              alt="preview"
            />
          )}
        </div>
      )}

      {/* INPUT ROW */}
      <div className="flex items-center gap-2">

        {/* LEFT SIDE ICONS — image, mic, video */}
        <div className="flex items-center gap-2 flex-shrink-0">

          {/* IMAGE */}
          <button
            type="button"
            onClick={() => imageInputRef.current.click()}
            className="text-gray-400 hover:text-white transition cursor-pointer"
            title="Send image"
          >
            <FaImage size={18} />
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleImageSelect}
          />

          {/* MICROPHONE / STOP */}
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="text-gray-400 hover:text-white transition cursor-pointer"
              title="Record voice message"
            >
              <FaMicrophone size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="text-red-500 animate-pulse cursor-pointer"
              title="Stop recording"
            >
              <FaStop size={18} />
            </button>
          )}

          {/* VIDEO */}
          <button
            type="button"
            onClick={() => videoInputRef.current.click()}
            className="text-gray-400 hover:text-white transition cursor-pointer"
            title="Send video"
          >
            <FaVideo size={18} />
          </button>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            hidden
            onChange={handleVideoSelect}
          />
        </div>

        {/* TEXT INPUT — grows to fill remaining space */}
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

        {/* SEND BUTTON — stays on the right */}
        <button
          onClick={handleSendMessage}
          className="bg-blue-600 hover:bg-blue-700 transition p-2 rounded-full text-white flex-shrink-0"
          title="Send message"
        >
          <IoSend />
        </button>
      </div>
    </div>
  );
}

export default Textinput;