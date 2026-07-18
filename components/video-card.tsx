import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";

interface Video {
  id: string;
  title: string;
  description: string | null;
  summary: string | null;
  category: string;
  embedUrl: string;
  thumbnail: string | null;
  date: string | null;
}

export function VideoCard({ video }: { video: Video }) {
  return (
    <Link href={`/works/${video.id}`} aria-label={video.title} className="block">
      <div
        data-vt-id={video.id}
        className="group relative aspect-video bg-neutral-900 overflow-hidden cursor-pointer"
      >
        {video.thumbnail ? (
          <Image
            src={video.thumbnail}
            alt={video.title}
            fill
            sizes="(max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-all duration-300 group-hover:scale-105 group-hover:brightness-110"
          />
        ) : (
          <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
            <Play className="w-12 h-12 text-neutral-600" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent transition-all duration-300" />
        {/* Always visible: category + title at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 z-10">
          <span className="text-[10px] md:text-xs lg:text-sm text-neutral-400 mb-1 block">{video.category}</span>
          <h3 className="font-semibold text-xs sm:text-sm md:text-base lg:text-lg leading-tight">{video.title}</h3>
          {video.summary && (
            <div className="grid transition-[grid-template-rows] duration-300 ease-in-out grid-rows-[0fr] group-hover:grid-rows-[1fr]">
              <p className="text-neutral-300 text-[10px] sm:text-xs md:text-sm lg:text-base line-clamp-2 overflow-hidden">
                <span className="block mt-1">{video.summary}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
