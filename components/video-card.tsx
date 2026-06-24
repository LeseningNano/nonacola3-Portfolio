"use client";

import { Play } from "lucide-react";

interface Video {
  id: string;
  title: string;
  description: string | null;
  category: string;
  embedUrl: string;
  thumbnail: string | null;
  date: string | null;
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
      className="group relative aspect-video bg-zinc-900 overflow-hidden cursor-pointer"
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
      {/* Gradient overlay — stronger on hover for description readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent transition-all duration-300" />
      {/* Always visible: category + title at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        <span className="text-[10px] text-zinc-400 mb-1 block">{video.category}</span>
        <h3 className="font-semibold text-sm md:text-base leading-tight">{video.title}</h3>
        {/* Description — revealed on hover, pushed below title */}
        {video.description && (
          <p className="text-zinc-300 text-xs md:text-sm line-clamp-2 mt-1 max-h-0 overflow-hidden opacity-0 group-hover:max-h-20 group-hover:opacity-100 transition-all duration-300">
            {video.description}
          </p>
        )}
      </div>
    </div>
  );
}
