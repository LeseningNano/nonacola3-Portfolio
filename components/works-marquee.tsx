import { VideoCard } from "./video-card";

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

export function WorksMarquee({ videos }: { videos: Video[] }) {
  // 复制一份实现无缝循环；translateX(-50%) 时第二份恰好接上
  const doubled = [...videos, ...videos];
  return (
    <div className="marquee-container overflow-hidden w-full">
      <div className="animate-marquee flex gap-1 w-max">
        {doubled.map((video, i) => (
          <div key={`${video.id}-${i}`} className="w-64 md:w-80 flex-shrink-0" aria-hidden={i >= videos.length}>
            <VideoCard video={video} />
          </div>
        ))}
      </div>
    </div>
  );
}
