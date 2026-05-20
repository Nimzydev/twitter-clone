import React, { useEffect } from "react";
import { IoMdClose } from "react-icons/io";

function ImageViewerModal({ imageUrl, altText = "Profile picture", onClose }) {
  if (!imageUrl) return null;

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white bg-black/60 hover:bg-black/80 p-2 rounded-full transition z-10"
        title="Close"
      >
        <IoMdClose size={24} />
      </button>

      {/* Image — clicking the image itself does not close the modal */}
      <img
        src={imageUrl}
        alt={altText}
        onClick={(e) => e.stopPropagation()}
        className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl"
      />
    </div>
  );
}

export default ImageViewerModal;