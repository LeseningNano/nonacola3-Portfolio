"use client";

import { useEffect, useState } from "react";
import { ExternalLink, X } from "lucide-react";
import { getEmbedUrl } from "@/lib/utils";

interface Video {
  id: string;
  title: string;
  description: string | null;
  category: string;
  embedUrl: string;
  date: string | null;
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
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Video */}
          <div className="flex-1 min-w-0">
            <div className="aspect-video w-full rounded-lg overflow-hidden bg-black shadow-2xl border border-zinc-800">
              <iframe
                src={getEmbedUrl(video.embedUrl)}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
            {/* Title + tags below video */}
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-white">{video.title}</h3>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm font-medium text-zinc-400 bg-zinc-800/50 px-2.5 py-0.5 rounded-full">
                  {video.category}
                </span>
                {video.date && (
                  <span className="text-sm text-zinc-500">
                    {new Date(video.date).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
                  </span>
                )}
              </div>
            </div>
          </div>
          {/* Description panel */}
          {video.description && (
            <div className="lg:w-[320px] xl:w-[380px] flex-shrink-0 flex flex-col">
              <h4 className="text-sm font-medium text-zinc-400 mb-3">关于</h4>
              <p className="text-zinc-300 leading-relaxed whitespace-pre-line">{video.description}</p>
            </div>
          )}
        </div>
        {/* Bottom row: close button right */}
        <div className="flex justify-end mt-4">
          <a
            href={video.embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-4 py-2 rounded-full transition-colors"
          >
            跳转至视频
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
