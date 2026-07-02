"use client";

import { useState, useEffect, useMemo } from "react";
import { AlertCircle } from "lucide-react";
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

interface YearGroup {
  year: string;
  videos: Video[];
}

export function VideoGrid() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState("全部");
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showShowreel, setShowShowreel] = useState(false);

  useEffect(() => {
    fetch("/api/videos")
      .then((res) => {
        if (!res.ok) throw new Error("加载作品失败");
        return res.json();
      })
      .then((data) => setVideos(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

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

  const yearGroups = useMemo(() => {
    const groups: Record<string, Video[]> = {};
    for (const v of filteredVideos) {
      const year = v.date
        ? new Date(v.date).getFullYear().toString()
        : "未分类";
      if (!groups[year]) groups[year] = [];
      groups[year].push(v);
    }
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([year, vids]) => ({ year, videos: vids }));
  }, [filteredVideos]);

  return (
    <section id="works" className="w-full bg-[#0a0a0a]">
      <div className="pt-16">
        <div className="mb-6 px-6 md:px-12 lg:px-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight" style={{ fontFamily: "'Bitcount Grid Single', sans-serif" }}>works.</h2>
          <p className="text-base md:text-lg text-zinc-400 font-light mt-1">精选视频作品与创作项目</p>
        </div>
        <div className="px-6 md:px-12 lg:px-16 mb-6">
          <CategoryFilter
            categories={years}
            selected={selectedYear}
            onSelect={setSelectedYear}
          />
        </div>

        {/* Showreel strip */}
        <div className="px-6 md:px-12 lg:px-16 mb-6">
          <button
            onClick={() => setShowShowreel(true)}
            className="w-full aspect-[3/1] md:aspect-[4/1] bg-zinc-900 overflow-hidden cursor-pointer group relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-800/50 to-transparent" />
            <div className="absolute inset-0 p-4 md:p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-zinc-500 text-xs md:text-sm tracking-wider">REEL</span>
                <span className="text-sm md:text-base text-zinc-400 group-hover:text-white transition-colors duration-300">视觉创作总结</span>
              </div>
              <span className="text-zinc-600 group-hover:text-zinc-400 text-xs md:text-sm transition-colors duration-300">▶</span>
            </div>
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 px-6 md:px-12 lg:px-16">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-video bg-zinc-900 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
            <AlertCircle className="w-8 h-8 mb-3" />
            <p>{error}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {yearGroups.map((group) => (
              <div key={group.year}>
                <div className="px-6 md:px-12 lg:px-16 mb-3">
                  <span className="text-sm font-medium text-zinc-500 tracking-wider">{group.year}</span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-1">
                  {group.videos.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      onClick={() => setSelectedVideo(video)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

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
