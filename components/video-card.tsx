import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";
import type { VideoRow } from "@/lib/types";

export function VideoCard({ video }: { video: VideoRow }) {
  return (
    <Link href={`/works/${video.id}`} aria-label={video.title} className="block outline-none focus-visible:ring-1 focus-visible:ring-neutral-400">
      <div
        data-vt-id={video.id}
        className="group relative aspect-video bg-neutral-900 overflow-hidden cursor-pointer transform-gpu"
      >
        {video.thumbnail ? (
          /* 缩略图 + 渐变遮罩共用一个缩放 wrapper，作为同一合成层一起 scale，
             避免 marquee 父级 transform 动画下子像素错位导致遮罩与封面不齐出现白边。 */
          <div className="absolute inset-0 transition-transform duration-300 group-hover:scale-105">
            <Image
              src={video.thumbnail}
              alt={video.title}
              fill
              sizes="(max-width: 1024px) 50vw, 25vw"
              className="object-cover"
            />
            {/* 渐变遮罩：从底部强黑到顶部微暗，保证标题区可读 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/10" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-neutral-800 flex items-center justify-center">
            <Play className="w-12 h-12 text-neutral-600" />
          </div>
        )}
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
