import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getVideo, getVideos } from "@/lib/data";
import { WorkPlayer } from "@/components/work-player";
import { MarkdownBody } from "@/components/markdown-body";
import { VideoCard } from "@/components/video-card";
import { WorkReturnLink } from "@/components/work-return-link";
import { pickRelatedVideos } from "@/lib/utils";
import { formatFullDate } from "@/lib/news-timeline";
import type { VideoRow } from "@/lib/types";

export const dynamic = "force-static";
export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const video = await getVideo(id);
  if (!video) return {};
  return {
    title: video.title,
    description: video.summary ?? video.description ?? undefined,
  };
}

export default async function WorkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [video, allVideos] = await Promise.all([getVideo(id), getVideos()]);
  if (!video) notFound();

  const serializedAll: VideoRow[] = allVideos.map((v) => ({
    id: v.id,
    title: v.title,
    description: v.description,
    summary: v.summary,
    role: v.role,
    tools: v.tools,
    category: v.category,
    embedUrl: v.embedUrl,
    thumbnail: v.thumbnail,
    featured: v.featured,
    order: v.order,
    date: v.date ? new Date(v.date).toISOString() : null,
  }));
  const related = pickRelatedVideos(serializedAll, video, 4);

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-16 px-6 md:px-12">
      <div className="max-w-5xl mx-auto">
        <WorkPlayer videoId={video.id} embedUrl={video.embedUrl} title={video.title} />

        {/* 标题区与文章页同一套：等宽小字的日期 · 分类，常规字重大标题（作品标题常较长，比文章页略小） */}
        <p className="mt-8 text-xs tracking-[0.24em] text-neutral-500">
          {[video.date ? formatFullDate(video.date) : null, video.category || null].filter(Boolean).join(" · ")}
        </p>
        <h1 className="mt-4 break-words text-3xl font-normal leading-[1.15] tracking-[-0.03em] text-white md:text-[44px]">
          {video.title}
        </h1>

        {video.summary && (
          <p className="text-neutral-300 mt-6 text-base md:text-lg leading-relaxed break-words">{video.summary}</p>
        )}
        {video.description && (
          <div className="mt-8 border-t border-neutral-800 pt-6">
            <h2 className="text-sm font-medium text-neutral-400 mb-3">关于</h2>
            <MarkdownBody content={video.description} />
          </div>
        )}

        <div className="flex items-center gap-4 mt-10">
          <a
            href={video.embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-neutral-300 hover:text-white border border-neutral-400 hover:border-white px-4 py-2 transition-all duration-300"
          >
            跳转至视频
            <ExternalLink className="w-4 h-4" />
          </a>
          <Suspense fallback={null}>
            <WorkReturnLink />
          </Suspense>
        </div>

        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl md:text-3xl font-normal tracking-tight" style={{ fontFamily: "var(--font-bitcount)" }}>
              more.
            </h2>
            <p className="text-sm md:text-base text-neutral-400 mt-1">相关作品</p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1">
              {related.map((v) => (
                <VideoCard key={v.id} video={v} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
