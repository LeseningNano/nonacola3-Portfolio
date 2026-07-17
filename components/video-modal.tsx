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
    }, 250);
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
        className={`relative w-[95vw] md:w-[90vw] 2xl:w-[85vw] max-w-[1600px] border border-zinc-700 bg-[#0a0a0a] ${
          isClosing ? "animate-modal-content-out" : "animate-modal-content"
        }`}
      >
        <button
          onClick={handleClose}
          className="absolute -top-12 right-0 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-8 h-8" />
        </button>

        {/* Video + About side by side */}
        <div className="flex flex-col lg:flex-row border-b border-zinc-700">
          {/* Video */}
          <div className="flex-1 min-w-0">
            <div className="aspect-video w-full overflow-hidden bg-black">
            <iframe
              src={`${getEmbedUrl(video.embedUrl)}${getEmbedUrl(video.embedUrl).includes("?") ? "&" : "?"}mute=1&muted=1`}
              title={video.title}
              className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          </div>

          {/* About */}
          {video.description && (
            <div className="lg:w-[320px] xl:w-[380px] flex-shrink-0 px-6 py-5 border-t lg:border-t-0 lg:border-l border-zinc-700">
              <h4 className="text-sm font-medium text-zinc-400 mb-3">关于</h4>
              <p className="text-zinc-300 leading-relaxed whitespace-pre-line">{video.description}</p>
            </div>
          )}
        </div>

        {/* Title + info row */}
        <div className="px-6 py-4 border-b border-zinc-700 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">{video.title}</h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs font-medium text-zinc-400 border border-zinc-700 px-2 py-0.5">
                {video.category}
              </span>
              {video.date && (
                <span className="text-xs text-zinc-500">
                  {new Date(video.date).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Jump to video - clickable row */}
        <a
          href={video.embedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-6 py-4 text-zinc-300 hover:text-white hover:bg-zinc-800/50 transition-all duration-300 group"
        >
          <span className="text-sm">跳转至视频</span>
          <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
        </a>
      </div>
    </div>
  );
}
