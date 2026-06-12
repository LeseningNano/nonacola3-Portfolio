"use client";

import { useState, useEffect } from "react";
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
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    fetch("/api/videos")
      .then((res) => res.json())
      .then((data) => setVideos(data));
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
        <h2 className="text-3xl font-bold mb-8">作品展示</h2>
        <CategoryFilter
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
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
      </div>
    </section>
  );
}
