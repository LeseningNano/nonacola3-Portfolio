"use client";

import { useState, useEffect, useMemo } from "react";
import { AlertCircle } from "lucide-react";
import { VideoCard } from "./video-card";
import { VideoModal } from "./video-modal";
import { CategoryFilter } from "./category-filter";

interface Video {
  id: string;
  title: string;
  description: string | null;
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
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

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

  const categories = useMemo(
    () => [...new Set(videos.map((v) => v.category))],
    [videos]
  );

  const filteredVideos =
    selectedCategory === "全部"
      ? videos
      : videos.filter((v) => v.category === selectedCategory);

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
    <section id="works" className="h-screen w-full overflow-y-auto scrollbar-hide bg-[#0a0a0a]">
      <div className="pt-24 pb-20">
        <div className="mb-6 px-6 md:px-12 lg:px-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">作品展示</h2>
          <p className="text-base md:text-lg text-zinc-400 font-light mt-3">精选视频作品与创作项目</p>
        </div>
        <div className="px-6 md:px-12 lg:px-16 mb-6">
          <CategoryFilter
            categories={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
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
      </div>
    </section>
  );
}
