import { VideoCard } from "./video-card";
import type { VideoRow } from "@/lib/types";

export function WorksMarquee({ videos }: { videos: VideoRow[] }) {
  // 卡片约 324px 宽（w-80 + 间距），半份至少 ~4200px 才能保证超宽屏下
  // translateX(-50%) 循环时右端不露底。按视频数计算每半份的重复次数。
  const repeat = Math.max(1, Math.ceil(4200 / (videos.length * 324)));
  const sets = Array.from({ length: repeat }, () => videos).flat();
  const halves = [0, 1];
  // 速度恒定 ~36px/s：时长随半份宽度（份数）等比放大
  const duration = videos.length * repeat * 9;
  return (
    <div className="marquee-container overflow-hidden w-full">
      <div className="animate-marquee flex w-max" style={{ animationDuration: `${duration}s` }}>
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
