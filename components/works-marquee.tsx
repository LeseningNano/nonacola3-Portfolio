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
  // 两个完全等宽的半份（各自带尾部间距），translateX(-50%) 恰好无缝衔接
  const halves = [0, 1];
  return (
    <div className="marquee-container overflow-hidden w-full">
      <div className="animate-marquee flex w-max">
        {halves.map((half) => (
          <div key={half} className="flex gap-1 pr-1" aria-hidden={half === 1}>
            {videos.map((video) => (
              <div key={video.id} className="w-64 md:w-80 flex-shrink-0">
                <VideoCard video={video} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
