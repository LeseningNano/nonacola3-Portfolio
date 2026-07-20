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
  // 卡片约 324px 宽（w-80 + 间距），半份至少 ~4200px 才能保证超宽屏下
  // translateX(-50%) 循环时右端不露底。按视频数计算每半份的重复次数。
  const repeat = Math.max(1, Math.ceil(4200 / (videos.length * 324)));
  const sets = Array.from({ length: repeat }, () => videos).flat();
  const halves = [0, 1];
  return (
    <div className="marquee-container overflow-hidden w-full">
      <div className="animate-marquee flex w-max">
        {halves.map((half) => (
          <div key={half} className="flex gap-1 pr-1" aria-hidden={half === 1}>
            {sets.map((video, i) => (
              <div key={`${video.id}-${i}`} className="w-64 md:w-80 flex-shrink-0">
                <VideoCard video={video} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
