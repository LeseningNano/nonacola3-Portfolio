import Image from "next/image";
import { Play } from "lucide-react";
import { IntentPrefetchLink } from "@/components/intent-prefetch-link";
import { createThumbnailProxyPath } from "@/lib/works-index";
import type { VideoRow } from "@/lib/types";

interface WorkCardProps {
  work: VideoRow;
  href: string;
  meta: string;
  sizes: string;
  ariaLabel?: string;
  summary?: string | null;
  details?: string[];
  size?: "default" | "large";
  index?: string;
}

// 首页与 /works 共用的作品卡片：缩略图在上、文字在下，不叠字。
// 缩略图容器保留 data-vt-id，ProgressBar 的缩略图飞入转场依赖它。
// 悬停效果只在 md 及以上生效，避免触屏点按后「粘住」。
export function WorkCard({
  work,
  href,
  meta,
  sizes,
  ariaLabel,
  summary,
  details,
  size = "default",
  index,
}: WorkCardProps) {
  const thumbnail = work.thumbnail
    ? createThumbnailProxyPath(work.thumbnail) ?? work.thumbnail
    : null;

  return (
    <IntentPrefetchLink
      href={href}
      aria-label={ariaLabel}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      <div data-vt-id={work.id} className="relative aspect-video overflow-hidden bg-neutral-900">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt=""
            fill
            unoptimized={thumbnail.startsWith("/media/thumbnail")}
            sizes={sizes}
            className="object-cover transition-transform duration-700 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none md:group-hover:scale-105 md:group-focus-visible:scale-105"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center">
            <Play aria-hidden="true" className="h-10 w-10 text-neutral-600" />
          </span>
        )}
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-black/30 transition-opacity duration-300 motion-reduce:transition-none md:group-hover:opacity-0 md:group-focus-visible:opacity-0"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 flex translate-y-2 items-center justify-center text-xs tracking-[0.2em] text-white opacity-0 transition-[opacity,transform] duration-300 motion-reduce:transition-none md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-focus-visible:translate-y-0 md:group-focus-visible:opacity-100"
        >
          ▶ PLAY
        </span>
      </div>
      <div className={index ? "mt-4 grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 md:grid-cols-[3.5rem_minmax(0,1fr)] md:gap-4" : "mt-3.5"}>
        {index && (
          <span
            aria-hidden="true"
            className="text-xl leading-none text-neutral-500 md:text-2xl"
            style={{ fontFamily: "var(--font-bitcount)" }}
          >
            {index}
          </span>
        )}
        <div>
          <h3 className={size === "large" ? "text-lg md:text-xl" : "text-base"}>
            <span className="relative">
              {work.title}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-white transition-transform duration-[450ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none md:group-hover:scale-x-100 md:group-focus-visible:scale-x-100"
              />
            </span>
          </h3>
          {meta && <p className="mt-1 text-[13px] text-neutral-400">{meta}</p>}
          {details?.map((line) => (
            <p key={line} className="mt-1 text-[13px] text-neutral-400">{line}</p>
          ))}
          {summary && <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-400">{summary}</p>}
        </div>
      </div>
    </IntentPrefetchLink>
  );
}
