import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getVideo } from "@/lib/data";
import { WorkPlayer } from "@/components/work-player";

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
  const video = await getVideo(id);
  if (!video) notFound();

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-16 px-6 md:px-12">
      <div className="max-w-5xl mx-auto">
        <WorkPlayer videoId={video.id} embedUrl={video.embedUrl} title={video.title} />

        <h1 className="text-2xl md:text-4xl font-bold text-white mt-8 break-words">{video.title}</h1>
        <div className="flex items-center gap-3 mt-3">
          <span className="text-xs font-medium text-neutral-400 border border-neutral-700 px-2 py-0.5">
            {video.category}
          </span>
          {video.date && (
            <span className="text-xs text-neutral-500">
              {new Date(video.date).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
            </span>
          )}
        </div>

        {video.summary && (
          <p className="text-neutral-300 mt-6 text-base md:text-lg leading-relaxed break-words">{video.summary}</p>
        )}
        {video.description && (
          <div className="mt-8 border-t border-neutral-800 pt-6">
            <h2 className="text-sm font-medium text-neutral-400 mb-3">关于</h2>
            <p className="text-neutral-300 leading-relaxed whitespace-pre-line break-words">{video.description}</p>
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
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-neutral-300 hover:text-white border border-neutral-400 hover:border-white px-4 py-2 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            返回主页
          </Link>
        </div>
      </div>
    </div>
  );
}
