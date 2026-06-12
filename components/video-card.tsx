"use client";

import { Play } from "lucide-react";

interface Video {
  id: string;
  title: string;
  description: string | null;
  category: string;
  embedUrl: string;
  thumbnail: string | null;
}

export function VideoCard({
  video,
  onClick,
}: {
  video: Video;
  onClick: () => void;
}) {
  return (
    <div
      className="group relative aspect-video bg-zinc-900 rounded-lg overflow-hidden cursor-pointer"
      onClick={onClick}
    >
      {video.thumbnail ? (
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
          <Play className="w-12 h-12 text-zinc-600" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <span className="text-xs text-zinc-400 mb-1 block">{video.category}</span>
        <h3 className="font-semibold text-lg">{video.title}</h3>
        {video.description && (
          <p className="text-zinc-400 text-sm line-clamp-2">
            {video.description}
          </p>
        )}
      </div>
    </div>
  );
}
