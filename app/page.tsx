import { getHero, getVideos, getPosts } from "@/lib/data";
import { HomeClient } from "@/components/home-client";
import type { VideoRow, PostItem } from "@/lib/types";

export default async function Home() {
  const [hero, videos, posts] = await Promise.all([getHero(), getVideos(), getPosts()]);

  const serializedVideos: VideoRow[] = videos.map((v) => ({
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

  const serializedPosts: PostItem[] = posts.map((p) => ({
    id: p.id,
    title: p.title,
    body: p.body,
    tag: p.tag,
    createdAt: new Date(p.createdAt).toISOString(),
  }));

  return (
    <HomeClient
      heroVideoUrl={hero?.blobUrl ?? null}
      videos={serializedVideos}
      posts={serializedPosts}
    />
  );
}
