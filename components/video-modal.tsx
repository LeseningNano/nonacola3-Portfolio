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
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 ${
        isClosing ? "animate-modal-backdrop-out" : "animate-modal-backdrop"
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
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
          <iframe
            src={getEmbedUrl(video.embedUrl)}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>

        {/* Title area */}
        <div className="px-6 py-5 border-t border-zinc-700">
          <h3 className="text-2xl font-bold text-white">{video.title}</h3>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-sm font-medium text-zinc-400 border border-zinc-700 px-2.5 py-0.5">
              {video.category}
            </span>
            {video.date && (
              <span className="text-sm text-zinc-500">
                {new Date(video.date).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
              </span>
            )}
          </div>
        </div>

        {/* About area */}
        {video.description && (
          <div className="px-6 py-5 border-t border-zinc-700">
            <h4 className="text-sm font-medium text-zinc-400 mb-3">关于</h4>
            <p className="text-zinc-300 leading-relaxed whitespace-pre-line">{video.description}</p>
          </div>
        )}

        {/* Jump to video area */}
        <div className="px-6 py-4 border-t border-zinc-700 flex justify-end">
          <a
            href={video.embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white border border-zinc-400 hover:border-white px-4 py-2 transition-all duration-300"
          >
            跳转至视频
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
