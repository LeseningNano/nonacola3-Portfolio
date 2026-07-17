"use client";

import { useState, useMemo } from "react";
import { VideoCard } from "./video-card";
import { VideoModal } from "./video-modal";
import { ShowreelModal } from "./showreel-modal";
import { CategoryFilter } from "./category-filter";
import { Footer } from "./footer";

interface Video {
  id: string;
  title: string;
  description: string | null;
  summary: string | null;
  category: string;
  embedUrl: string;
  thumbnail: string | null;
  featured: boolean;
  order: number;
  date: string | null;
}

export function VideoGrid({ videos }: { videos: Video[] }) {
  const [selectedYear, setSelectedYear] = useState("全部");
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
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
    <section id="works" className="w-full bg-[#0a0a0a]">
      <div className="pt-16">
        <div className="mb-8 px-6 md:px-12 lg:px-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight" style={{ fontFamily: "var(--font-bitcount)" }}>works.</h2>
          <p className="text-base md:text-lg text-zinc-400 font-light mt-1">精选视频作品与创作项目</p>
        </div>
        <div className="px-6 md:px-12 lg:px-16 mb-8">
          <CategoryFilter
            categories={years}
            selected={selectedYear}
            onSelect={setSelectedYear}
          />
        </div>

        {/* Showreel strip */}
        <div className="mb-10">
          <button
            onClick={() => setShowShowreel(true)}
            className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 transition-colors duration-300 cursor-pointer group flex items-center justify-between px-6 md:px-12 lg:px-16"
          >
            <div className="flex items-center gap-3">
              <span className="text-zinc-500 text-sm md:text-base tracking-wider translate-y-px" style={{ fontFamily: "var(--font-bitcount)" }}>REEL</span>
              <span className="text-sm md:text-base text-zinc-400 group-hover:text-white transition-colors duration-300">视觉创作总结</span>
            </div>
            <span className="text-zinc-600 group-hover:text-zinc-400 text-xs transition-colors duration-300">▶</span>
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {filteredVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onClick={() => setSelectedVideo(video)}
            />
          ))}
        </div>

        {selectedVideo && (
          <VideoModal
            video={selectedVideo}
            onClose={() => setSelectedVideo(null)}
          />
        )}

        {showShowreel && (
          <ShowreelModal onClose={() => setShowShowreel(false)} />
        )}

        <Footer />
      </div>
    </section>
  );
}
