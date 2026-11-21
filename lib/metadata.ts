import type { Metadata } from "next";
import { getPostExcerpt } from "@/lib/post-excerpt";
import { createThumbnailProxyPath } from "@/lib/works-index";

export const SITE_URL = "https://www.nonacola3.com";
export const SITE_NAME = "nonacola3";
export const DEFAULT_TITLE = "nonacola3 — Video Portfolio";
export const DEFAULT_DESCRIPTION = "nonacola3 的视频作品集：精选 PV / 影像创作项目。";
export const DEFAULT_OG_IMAGE = "/hero-poster.webp";
export const META_DESCRIPTION_MAX_LENGTH = 160;

export function resolveShareImage(url: string | null | undefined): string {
  const trimmed = url?.trim();
  if (!trimmed) return DEFAULT_OG_IMAGE;
  return createThumbnailProxyPath(trimmed) ?? trimmed;
}

export function buildWorkMetadata(video: {
  id: string;
  title: string;
  summary: string | null;
  description: string | null;
  thumbnail: string | null;
}): Metadata {
  const description =
    video.summary?.trim() ||
    (video.description ? getPostExcerpt(video.description, META_DESCRIPTION_MAX_LENGTH) : "") ||
    DEFAULT_DESCRIPTION;
  const image = resolveShareImage(video.thumbnail);

  return {
    title: video.title,
    description,
    openGraph: {
      title: video.title,
      description,
      type: "website",
      url: `/works/${video.id}`,
      siteName: SITE_NAME,
      locale: "zh_CN",
      images: [{ url: image, alt: video.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: video.title,
      description,
      images: [image],
    },
  };
}

export function buildNewsMetadata(post: {
  id: string;
  title: string;
  body: string;
  createdAt: Date | string;
}): Metadata {
  const description =
    getPostExcerpt(post.body, META_DESCRIPTION_MAX_LENGTH) || DEFAULT_DESCRIPTION;

  return {
    title: post.title,
    description,
    openGraph: {
      title: post.title,
      description,
      type: "article",
      url: `/news/${post.id}`,
      siteName: SITE_NAME,
      locale: "zh_CN",
      publishedTime: new Date(post.createdAt).toISOString(),
      images: [{ url: DEFAULT_OG_IMAGE, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}
