import { getHero, getVideos, getPublishedPosts } from "@/lib/data";
import { resolveHeroMedia } from "@/lib/hero";
import { HomeClient } from "@/components/home-client";
import type { VideoRow, PostItem } from "@/lib/types";

export default async function Home() {
  const [heroRecord, videos, posts] = await Promise.all([getHero(), getVideos(), getPublishedPosts()]);
  const hero = resolveHeroMedia(heroRecord);

  const serializedVideos: VideoRow[] = videos.map((v) => ({
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

  const serializedPosts: PostItem[] = posts.map((p) => ({
    id: p.id,
    title: p.title,
    body: p.body,
    tag: p.tag,
    published: p.published,
    createdAt: new Date(p.createdAt).toISOString(),
  }));

  return (
    <HomeClient
      heroVideoUrl={hero?.blobUrl ?? null}
      heroPosterUrl={hero?.posterUrl ?? null}
      videos={serializedVideos}
      posts={serializedPosts}
    />
  );
}
