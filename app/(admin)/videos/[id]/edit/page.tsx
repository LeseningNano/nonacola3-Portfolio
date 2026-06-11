import { db } from "@/lib/db";
import { VideoForm } from "@/components/admin/video-form";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditVideoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const video = await db.video.findUnique({ where: { id } });

  if (!video) notFound();

  return (
    <div className="min-h-screen p-8 max-w-2xl mx-auto">
      <VideoForm
        mode="edit"
        initialData={{
          id: video.id,
          title: video.title,
          description: video.description ?? "",
          category: video.category,
          embedUrl: video.embedUrl,
          thumbnail: video.thumbnail ?? "",
          featured: video.featured,
          order: video.order,
        }}
      />
    </div>
  );
}
