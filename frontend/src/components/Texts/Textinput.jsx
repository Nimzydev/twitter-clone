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

  // IMAGE SELECT
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMedia(file);
    const reader = new FileReader();
    reader.onload = () => setMediaPreview(reader.result);
    reader.readAsDataURL(file);
  };

  // VIDEO SELECT
  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMedia(file);
    const previewUrl = URL.createObjectURL(file);
    setMediaPreview(previewUrl);
  };

  // CANCEL MEDIA PREVIEW
  const handleCancelMedia = () => {
    setMedia(null);
    setMediaPreview(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  // START RECORDING
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

  // STOP RECORDING
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // SEND MESSAGE
  // NOTE: We do NOT emit socket events here.
  // The server's sendMessage controller already emits "newMessage"
  // directly to the receiver via io.to(receiverSocketId).emit(...)
  // Emitting again from the client would cause double-counting.
  const handleSendMessage = async () => {
    if (!message.trim() && !media) return;

    try {
      const formData = new FormData();
      formData.append("text", message);
      if (media) formData.append("file", media);

      const res = await fetch(
        `/api/message/send/${selectedConversation._id}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Update sender's own chat UI instantly
      setMessages((prev) => [...(prev || []), data]);

      // RESET
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
          {/* X CANCEL BUTTON */}
          <button
            onClick={handleCancelMedia}
            className="absolute -top-2 -right-2 bg-black/80 hover:bg-black text-white rounded-full p-0.5 z-10"
            title="Cancel"
          >
            <IoMdClose size={16} />
          </button>

          {/* AUDIO */}
          {media?.type?.startsWith("audio") && (
            <audio controls src={mediaPreview} className="w-full" />
          )}

          {/* VIDEO */}
          {media?.type?.startsWith("video") && (
            <video controls className="w-52 rounded-lg">
              <source src={mediaPreview} />
            </video>
          )}

          {/* IMAGE */}
          {media?.type?.startsWith("image") && (
            <img
              src={mediaPreview}
              className="w-24 h-24 object-cover rounded-lg"
              alt="preview"
            />
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
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
          className="flex-1 px-3 py-2 rounded-full bg-gray-900 text-white border border-gray-700 outline-none"
        />

        {/* IMAGE BUTTON */}
        <button
          type="button"
          onClick={() => imageInputRef.current.click()}
          className="text-gray-400 hover:text-white transition cursor-pointer"
        >
          <FaImage />
        </button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleImageSelect}
        />

        {/* MICROPHONE */}
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            className="text-gray-400 hover:text-white transition cursor-pointer"
          >
            <FaMicrophone />
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="text-red-500 animate-pulse cursor-pointer"
          >
            <FaStop />
          </button>
        )}

        {/* VIDEO BUTTON */}
        <button
          type="button"
          onClick={() => videoInputRef.current.click()}
          className="text-gray-400 hover:text-white transition cursor-pointer"
        >
          <FaVideo />
        </button>
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          hidden
          onChange={handleVideoSelect}
        />

        {/* SEND */}
        <button
          onClick={handleSendMessage}
          className="bg-blue-600 hover:bg-blue-700 transition p-2 rounded-full text-white"
        >
          <IoSend />
        </button>
      </div>
    </div>
  );
}

export default Textinput;