"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getEmbedUrl } from "@/lib/utils";

interface Video {
  id: string;
  title: string;
  description: string | null;
  category: string;
  embedUrl: string;
}

export function VideoModal({
  video,
  onClose,
}: {
  video: Video;
  onClose: () => void;
}) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 250); // Matches the CSS animation duration slightly offset
  };

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isClosing]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 ${
        isClosing ? "animate-modal-backdrop-out" : "animate-modal-backdrop"
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className={`relative w-[95vw] md:w-[90vw] 2xl:w-[85vw] max-w-[1600px] ${
          isClosing ? "animate-modal-content-out" : "animate-modal-content"
        }`}
      >
        <button
          onClick={handleClose}
          className="absolute -top-12 right-0 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-8 h-8" />
        </button>
        <div className="aspect-video w-full rounded-lg overflow-hidden bg-black shadow-2xl border border-zinc-800">
          <iframe
            src={getEmbedUrl(video.embedUrl)}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
        <div className="mt-6 px-2">
          <h3 className="text-2xl font-bold text-white">{video.title}</h3>
          <span className="inline-block mt-2 text-sm font-medium text-zinc-400 bg-zinc-800/50 px-2.5 py-0.5 rounded-full">
            {video.category}
          </span>
          {video.description && (
            <p className="text-zinc-300 mt-4 leading-relaxed max-w-4xl">{video.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
