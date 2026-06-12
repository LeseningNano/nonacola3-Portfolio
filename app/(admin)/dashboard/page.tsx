import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { VideoTable } from "@/components/admin/video-table";
import { HeroUpload } from "@/components/admin/hero-upload";
import { ShowreelSettings } from "@/components/admin/showreel-settings";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const videos = await db.video.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="min-h-screen pt-24 pb-8 px-8 max-w-6xl mx-auto space-y-12">
      {/* 页面设置 */}
      <section>
        <h2 className="text-lg font-semibold text-zinc-300 mb-4">页面设置</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <HeroUpload />
          <ShowreelSettings />
        </div>
      </section>

      {/* 作品管理 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-300">作品管理</h2>
          <Link href="/videos/new">
            <Button>添加视频</Button>
          </Link>
        </div>
        {videos.length === 0 ? (
          <p className="text-zinc-500">暂无视频，点击添加视频开始。</p>
        ) : (
          <VideoTable videos={videos} />
        )}
      </section>
    </div>
  );
}
