"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface Video {
  id: string;
  title: string;
  description: string | null;
  category: string;
  embedUrl: string;
}

function getEmbedUrl(url: string): string {
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/
  );
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }
  const biliMatch = url.match(
    /bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/
  );
  if (biliMatch) {
    return `https://player.bilibili.com/player.html?bvid=${biliMatch[1]}`;
  }
  return url;
}

export function VideoModal({
  video,
  onClose,
}: {
  video: Video;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-zinc-400 hover:text-white"
        >
          <X className="w-8 h-8" />
        </button>
        <div className="aspect-video w-full">
          <iframe
            src={getEmbedUrl(video.embedUrl)}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
        <div className="mt-4">
          <h3 className="text-xl font-semibold">{video.title}</h3>
          <span className="text-sm text-zinc-500">{video.category}</span>
          {video.description && (
            <p className="text-zinc-400 mt-2">{video.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
