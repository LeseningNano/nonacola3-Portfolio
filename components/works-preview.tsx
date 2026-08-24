import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { VideoCard } from "./video-card";
import type { VideoRow } from "@/lib/types";

export function WorksPreview({ videos }: { videos: VideoRow[] }) {
  const preview = videos.slice(0, 4);
  if (preview.length === 0) return null;

  return (
    <section id="works-preview" className="w-full bg-[#0a0a0a] px-6 md:px-12 lg:px-16 pt-16 pb-12">
      <h2 className="text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight" style={{ fontFamily: "var(--font-bitcount)" }}>
        works.
      </h2>
      <p className="text-base md:text-lg text-neutral-400 font-light mt-1">精选作品 · 完整列表见全部</p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1">
        {preview.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>

      <div className="flex justify-center mt-10">
        <Link
          href="/works"
          className="inline-flex items-center gap-2 text-xs md:text-sm tracking-widest text-neutral-300 hover:text-white border border-neutral-400 hover:border-white px-5 py-2.5 transition-all duration-300"
        >
          查看全部作品
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
