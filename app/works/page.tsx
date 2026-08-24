import type { Metadata } from "next";
import { getVideos } from "@/lib/data";
import { WorksClient } from "@/components/works-client";
import type { VideoRow } from "@/lib/types";

export const metadata: Metadata = {
  title: "Works",
};

export default async function WorksPage() {
  const videos = await getVideos();
  const serialized: VideoRow[] = videos.map((v) => ({
    id: v.id,
    title: v.title,
    description: v.description,
    summary: v.summary,
    category: v.category,
    embedUrl: v.embedUrl,
    thumbnail: v.thumbnail,
    featured: v.featured,
    order: v.order,
    date: v.date ? new Date(v.date).toISOString() : null,
  }));

  return <WorksClient videos={serialized} />;
}
