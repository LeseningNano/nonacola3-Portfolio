"use client";

import { useState, useEffect } from "react";
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

  const categories = [
    ...new Set(videos.map((v) => v.category)),
  ];

  const filteredVideos =
    selectedCategory === "全部"
      ? videos
      : videos.filter((v) => v.category === selectedCategory);

  return (
    <section id="works" className="h-screen w-full overflow-y-auto bg-[#0a0a0a]">
      <div className="pt-24 pb-20 px-4 max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-8 font-[family-name:var(--font-pixel)]">作品展示</h2>
        <CategoryFilter
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-video bg-zinc-900 rounded-lg animate-pulse" />
            ))
          ) : error ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-zinc-500">
              <AlertCircle className="w-8 h-8 mb-3" />
              <p>{error}</p>
            </div>
          ) : (
            filteredVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onClick={() => setSelectedVideo(video)}
              />
            ))
          )}
        </div>
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
