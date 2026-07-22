"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { VideoCard } from "./video-card";
import { WorksMarquee } from "./works-marquee";
import { ShowreelModal } from "./showreel-modal";
import { CategoryFilter } from "./category-filter";
import type { VideoRow } from "@/lib/types";

export function VideoGrid({ videos }: { videos: VideoRow[] }) {
  const [selectedYear, setSelectedYear] = useState("全部");
  const [showShowreel, setShowShowreel] = useState(false);
  const [showAll, setShowAll] = useState(false);

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
    <section id="works" className="w-full bg-[#0a0a0a]">
      <div className="pt-16">
        <div className="mb-8 px-6 md:px-12 lg:px-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight" style={{ fontFamily: "var(--font-bitcount)" }}>works.</h2>
          <p className="text-base md:text-lg text-neutral-400 font-light mt-1">精选视频作品与创作项目</p>
        </div>

        {/* Showreel strip */}
        <div className="mb-10">
          <button
            onClick={() => setShowShowreel(true)}
            className="w-full h-12 bg-neutral-900 hover:bg-neutral-800 transition-colors duration-300 cursor-pointer group flex items-center justify-between px-6 md:px-12 lg:px-16"
          >
            <div className="flex items-center gap-3">
              <span className="text-neutral-500 text-sm md:text-base tracking-wider translate-y-px" style={{ fontFamily: "var(--font-bitcount)" }}>REEL</span>
              <span className="text-sm md:text-base text-neutral-400 group-hover:text-white transition-colors duration-300">视觉创作总结</span>
            </div>
            <span className="text-neutral-600 group-hover:text-neutral-400 text-xs transition-colors duration-300">▶</span>
          </button>
        </div>

        <div key={showAll ? "grid" : "marquee"} className={showAll ? "animate-works-expand" : "animate-works-collapse"}>
          {showAll ? (
            <>
              <div className="px-6 md:px-12 lg:px-16 mb-8">
                <CategoryFilter
                  categories={years}
                  selected={selectedYear}
                  onSelect={setSelectedYear}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1">
                {filteredVideos.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            </>
          ) : (
            <WorksMarquee videos={videos} />
          )}
        </div>

        {/* 展开/收起开关 */}
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setShowAll((v) => !v)}
            className="inline-flex items-center gap-2 text-xs md:text-sm tracking-widest text-neutral-300 hover:text-white border border-neutral-400 hover:border-white px-5 py-2.5 transition-all duration-300"
          >
            {showAll ? (
              <>
                收起
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                显示全部作品
                <span className="text-neutral-500">{videos.length}</span>
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {showShowreel && (
          <ShowreelModal onClose={() => setShowShowreel(false)} />
        )}

      </div>
    </section>
  );
}
