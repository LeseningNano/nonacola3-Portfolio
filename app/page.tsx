import { getHero, getVideos } from "@/lib/data";
import { HomeClient } from "@/components/home-client";

export default async function Home() {
  const [hero, videos] = await Promise.all([getHero(), getVideos()]);

  const serializedVideos = videos.map((v) => ({
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

  return (
    <HomeClient
      heroVideoUrl={hero?.blobUrl ?? null}
      videos={serializedVideos}
    />
  );
}
