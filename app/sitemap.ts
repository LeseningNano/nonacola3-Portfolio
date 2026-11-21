import type { MetadataRoute } from "next";
import { getPublishedPosts, getVideos } from "@/lib/data";
import { SITE_URL } from "@/lib/metadata";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/works`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  try {
    const [videos, posts] = await Promise.all([getVideos(), getPublishedPosts()]);

    const videoEntries: MetadataRoute.Sitemap = videos.map((video) => ({
      url: `${SITE_URL}/works/${video.id}`,
      lastModified: video.updatedAt ?? video.date ?? video.createdAt,
      changeFrequency: "monthly",
      priority: 0.8,
    }));

    const articleEntries: MetadataRoute.Sitemap = posts
      .filter((post) => post.title !== null)
      .map((post) => ({
        url: `${SITE_URL}/news/${post.id}`,
        lastModified: post.createdAt,
        changeFrequency: "monthly",
        priority: 0.7,
      }));

    return [...staticEntries, ...videoEntries, ...articleEntries];
  } catch {
    return staticEntries;
  }
}
