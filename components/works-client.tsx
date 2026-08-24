"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Rows3, Grid2x2 } from "lucide-react";
import { VideoCard } from "./video-card";
import { CategoryFilter } from "./category-filter";
import { ShowreelModal } from "./showreel-modal";
import type { VideoRow } from "@/lib/types";

type ViewMode = "immersive" | "grid";

export function WorksClient({ videos }: { videos: VideoRow[] }) {
  const [view, setView] = useState<ViewMode>("immersive");
  const [selectedYear, setSelectedYear] = useState("全部");
  const [showShowreel, setShowShowreel] = useState(false);

  const years = useMemo(() => {
    const set = new Set<string>();
    for (const v of videos) {
      if (v.date) set.add(new Date(v.date).getFullYear().toString());
    }
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [videos]);

  const filteredVideos =
    selectedYear === "全部"
      ? videos
      : videos.filter((v) => v.date && new Date(v.date).getFullYear().toString() === selectedYear);

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        {/* 标题行 */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight" style={{ fontFamily: "var(--font-bitcount)" }}>
              works.
            </h1>
            <p className="text-base md:text-lg text-neutral-400 font-light mt-1">全部视频作品与创作项目</p>
          </div>
          <button
            aria-label={view === "immersive" ? "切换到网格视图" : "切换到沉浸视图"}
            onClick={() => setView((v) => (v === "immersive" ? "grid" : "immersive"))}
            className="text-neutral-400 hover:text-white border border-neutral-700 hover:border-neutral-400 p-2.5 transition-colors"
          >
            {view === "immersive" ? <Grid2x2 className="w-5 h-5" /> : <Rows3 className="w-5 h-5" />}
          </button>
        </div>

        {/* Showreel 横条 */}
        <div className="mb-10">
          <button
            onClick={() => setShowShowreel(true)}
            className="w-full h-12 bg-neutral-900 hover:bg-neutral-800 transition-colors duration-300 cursor-pointer group flex items-center justify-between px-4 md:px-6"
          >
            <div className="flex items-center gap-3">
              <span className="text-neutral-500 text-sm md:text-base tracking-wider translate-y-px" style={{ fontFamily: "var(--font-bitcount)" }}>REEL</span>
              <span className="text-sm md:text-base text-neutral-400 group-hover:text-white transition-colors duration-300">视觉创作总结</span>
            </div>
            <PlayGlyph />
          </button>
        </div>

        {/* 视图主体 */}
        {videos.length === 0 ? (
          <p className="text-neutral-600 text-sm mt-8">暂无作品。</p>
        ) : (
          <div key={view} className={view === "grid" ? "animate-works-expand" : "animate-works-collapse"}>
            {view === "immersive" ? (
              <div className="flex flex-col gap-6">
                {videos.map((video) => (
                  <ImmersiveCard key={video.id} video={video} />
                ))}
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <CategoryFilter categories={years} selected={selectedYear} onSelect={setSelectedYear} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1">
                  {filteredVideos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {showShowreel && <ShowreelModal onClose={() => setShowShowreel(false)} />}
    </div>
  );
}

function ImmersiveCard({ video }: { video: VideoRow }) {
  return (
    <Link
      href={`/works/${video.id}`}
      data-vt-id={video.id}
      aria-label={video.title}
      className="group relative block aspect-video md:aspect-[21/9] overflow-hidden transform-gpu"
    >
      {video.thumbnail ? (
        <div className="absolute inset-0 transition-transform duration-300 group-hover:scale-[1.03]">
          <Image src={video.thumbnail} alt={video.title} fill sizes="(max-width: 1152px) 100vw, 1152px" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-neutral-800" />
      )}
      <div className="absolute bottom-0 left-0 p-4 md:p-6 z-10">
        <span className="block text-xs md:text-sm text-neutral-400 mb-1">{video.category}</span>
        <span className="block text-base md:text-xl lg:text-2xl text-white font-medium">{video.title}</span>
      </div>
    </Link>
  );
}

function PlayGlyph() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-neutral-600 group-hover:text-neutral-400 transition-colors duration-300">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
