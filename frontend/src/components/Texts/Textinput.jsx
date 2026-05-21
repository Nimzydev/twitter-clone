import React, { useRef, useState, useCallback } from "react";
import { IoSend } from "react-icons/io5";
import { FaMicrophone, FaStop, FaPlus } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import useGetConversation from "../../../zustand/useGetConversations";

function Textinput() {
  const [message, setMessage] = useState("");
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const streamRef = useRef(null);

  const { selectedConversation, setMessages } = useGetConversation();

  // ── MEDIA (image or video) ────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMedia(file);

    if (file.type.startsWith("image")) {
      const reader = new FileReader();
      reader.onload = () => setMediaPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setMediaPreview(URL.createObjectURL(file));
    }

    // Reset so the same file can be re-selected after cancel
    e.target.value = "";
  };

  const handleCancelMedia = () => {
    setMedia(null);
    setMediaPreview(null);
  };

  // ── VOICE RECORDING — press and hold ─────────────────────────────────
  const startRecording = useCallback(async () => {
    // Don't start a new recording if one is already running
    if (isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

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
        setMediaPreview(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        clearInterval(recordingTimerRef.current);
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Show recording duration counter
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Microphone access denied:", error);
      alert(
        "Microphone access was denied. Please allow microphone access in your browser settings."
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

  // Touch events for press-and-hold on mobile
  const handleMicTouchStart = (e) => {
    e.preventDefault(); // prevents the 300ms click delay on mobile
    startRecording();
  };

  const handleMicTouchEnd = (e) => {
    e.preventDefault();
    stopRecording();
  };

  // Mouse events for press-and-hold on desktop
  const handleMicMouseDown = (e) => {
    e.preventDefault();
    startRecording();
  };

  const handleMicMouseUp = (e) => {
    e.preventDefault();
    stopRecording();
  };

  // Safety net — if user drags off the button, still stop recording
  const handleMicMouseLeave = () => {
    if (isRecording) stopRecording();
  };

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ── SEND MESSAGE ──────────────────────────────────────────────────────
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
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-2 bg-black">

      {/* MEDIA PREVIEW */}
      {mediaPreview && (
        <div className="mb-3 relative inline-block">
          {/* Cancel button */}
          <button
            onClick={handleCancelMedia}
            className="absolute -top-2 -right-2 bg-black/80 hover:bg-black text-white rounded-full p-0.5 z-10"
            title="Cancel"
          >
            <IoMdClose size={16} />
          </button>

          {media?.type?.startsWith("audio") && (
            <audio controls src={mediaPreview} className="w-full max-w-xs" />
          )}
          {media?.type?.startsWith("video") && (
            <video controls className="w-52 rounded-lg max-h-40">
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

      {/* RECORDING INDICATOR */}
      {isRecording && (
        <div className="flex items-center gap-2 mb-2 px-1">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-400 text-xs font-medium">
            Recording... {formatDuration(recordingDuration)}
          </span>
          <span className="text-gray-400 text-xs">Release to stop</span>
        </div>
      )}

      {/* INPUT ROW */}
      <div className="flex items-center gap-2">

        {/* + BUTTON — opens file picker for image or video */}
        <button
          type="button"
          onClick={() => fileInputRef.current.click()}
          className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 text-white transition"
          title="Attach image or video"
        >
          <FaPlus size={14} />
        </button>

        {/* Hidden file input — accepts both images and videos */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          hidden
          onChange={handleFileSelect}
        />

        {/* TEXT INPUT */}
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

        {/* MICROPHONE — press and hold to record */}
        <button
          type="button"
          onMouseDown={handleMicMouseDown}
          onMouseUp={handleMicMouseUp}
          onMouseLeave={handleMicMouseLeave}
          onTouchStart={handleMicTouchStart}
          onTouchEnd={handleMicTouchEnd}
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

        {/* SEND BUTTON */}
        <button
          onClick={handleSendMessage}
          className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-blue-600 hover:bg-blue-700 transition rounded-full text-white"
          title="Send message"
        >
          <IoSend size={15} />
        </button>
      </div>
    </div>
  );
}

export default Textinput;