"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getEmbedUrl } from "@/lib/utils";

interface ShowreelModalProps {
  onClose: () => void;
}

export function ShowreelModal({ onClose }: ShowreelModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [showreelUrl, setShowreelUrl] = useState("");
  const [videoType, setVideoType] = useState<"url" | "upload">("url");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/showreel")
      .then((res) => res.json())
      .then((data) => {
        if (data?.showreelUrl) setShowreelUrl(data.showreelUrl);
        if (data?.videoType) setVideoType(data.videoType);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => onClose(), 250);
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
      data-modal
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 ${
        isClosing ? "animate-modal-backdrop-out" : "animate-modal-backdrop"
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      onWheel={(e) => e.stopPropagation()}
    >
      <div
        className={`relative w-[95vw] md:w-[90vw] 2xl:w-[85vw] max-w-[1600px] border border-zinc-700 ${
          isClosing ? "animate-modal-content-out" : "animate-modal-content"
        }`}
      >
        <button
          onClick={handleClose}
          className="absolute -top-12 right-0 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-8 h-8" />
        </button>

        {/* Video */}
        <div className="aspect-video w-full overflow-hidden bg-black">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900">
              <div className="w-8 h-8 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
            </div>
          ) : videoType === "upload" ? (
            <video
              src={showreelUrl}
              controls
              autoPlay
              muted
              className="w-full h-full object-contain"
            />
          ) : (
            <iframe
              src={`${getEmbedUrl(showreelUrl)}${getEmbedUrl(showreelUrl).includes("?") ? "&" : "?"}mute=1&muted=1`}
              title="Showreel"
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          )}
        </div>
      </div>
    </div>
  );
}
