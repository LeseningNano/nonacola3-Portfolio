import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { VideoTable } from "@/components/admin/video-table";
import { HeroUpload } from "@/components/admin/hero-upload";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const videos = await db.video.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">后台管理</h1>
        <div className="space-x-4">
          <Link href="/videos/new">
            <Button>添加视频</Button>
          </Link>
        </div>
      </div>
      <div className="mb-8">
        <HeroUpload />
      </div>
      {videos.length === 0 ? (
        <p className="text-zinc-500">暂无视频，点击"添加视频"开始。</p>
      ) : (
        <VideoTable videos={videos} />
      )}
    </div>
  );
}
