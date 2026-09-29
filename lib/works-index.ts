import type { VideoRow } from "@/lib/types";

export interface WorkYearGroup {
  label: string;
  works: VideoRow[];
}

export const WORKS_HEADLINE =
  "Motion Designer creating PV, game promotional visuals and cinematic motion graphics.";

const HIGHLIGHTED_WORDS = new Set([
  "Motion",
  "Designer",
  "PV,",
  "game",
  "promotional",
  "visuals",
  "cinematic",
  "motion",
  "graphics.",
]);

export interface WorksHeadlineToken {
  text: string;
  highlighted: boolean;
}

export function getWorksHeadlineTokens(): WorksHeadlineToken[] {
  return WORKS_HEADLINE.split(" ").map((text) => ({
    text,
    highlighted: HIGHLIGHTED_WORDS.has(text),
  }));
}

export interface FilmographyEntry {
  work: VideoRow;
  sequence: number;
}

export interface WorkFilmographyGroup {
  label: string;
  entries: FilmographyEntry[];
}

export function createFilmography(
  groups: WorkYearGroup[]
): WorkFilmographyGroup[] {
  let sequence = 0;
  return groups.map((group) => ({
    label: group.label,
    entries: group.works.map((work) => ({ work, sequence: ++sequence })),
  }));
}

export function selectFeaturedWorks(videos: VideoRow[]): VideoRow[] {
  return videos.filter((video) => video.featured);
}

export function groupWorksByYear(videos: VideoRow[]): WorkYearGroup[] {
  const dated = new Map<number, VideoRow[]>();
  const other: VideoRow[] = [];

  for (const video of videos) {
    if (!video.date) {
      other.push(video);
      continue;
    }
    const year = new Date(video.date).getUTCFullYear();
    const group = dated.get(year) ?? [];
    group.push(video);
    dated.set(year, group);
  }

  const groups = [...dated.entries()]
    .sort(([a], [b]) => b - a)
    .map(([year, works]) => ({ label: String(year), works }));

  if (other.length > 0) groups.push({ label: "Other", works: other });
  return groups;
}

export function normalizeShowreelType(
  value: string | null | undefined
): "url" | "upload" {
  return value === "upload" ? "upload" : "url";
}

const THUMBNAIL_BLOB_HOST = "kq4mwotlyfyzycmp.public.blob.vercel-storage.com";

export function isAllowedThumbnailSource(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === THUMBNAIL_BLOB_HOST &&
      url.username === "" &&
      url.password === "" &&
      url.port === ""
    );
  } catch {
    return false;
  }
}

export function createThumbnailProxyPath(source: string): string | null {
  if (!isAllowedThumbnailSource(source)) return null;
  return `/media/thumbnail?url=${encodeURIComponent(source)}`;
}

export async function createThumbnailProxyResponse(
  source: string,
  fetcher: typeof fetch = fetch
): Promise<Response> {
  if (!isAllowedThumbnailSource(source)) {
    return new Response("Invalid thumbnail source", { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetcher(source, {
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return new Response("Thumbnail origin unavailable", { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  if (!upstream.ok || !contentType.toLowerCase().startsWith("image/")) {
    return new Response("Invalid thumbnail response", { status: 502 });
  }

  const headers = new Headers({
    "Cache-Control": "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400",
    "Content-Type": contentType,
    "Pages-Cache-Control": "public, s-maxage=2592000",
    "X-Content-Type-Options": "nosniff",
  });
  const etag = upstream.headers.get("etag");
  if (etag) headers.set("ETag", etag);

  return new Response(upstream.body, { status: 200, headers });
}

export function getWorkYear(date: string | null): string | null {
  if (!date) return null;
  const year = new Date(date).getUTCFullYear();
  return Number.isNaN(year) ? null : String(year);
}

export function formatWorkMeta(parts: Array<string | null | undefined>): string {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(" · ");
}

// 首页作品区：按后台顺序取前 6 个；手机端只显示前 3 个（由组件用 CSS 隐藏）
export const HOME_WORKS_LIMIT = 6;

export function selectHomeWorks(videos: VideoRow[]): VideoRow[] {
  return videos.slice(0, HOME_WORKS_LIMIT);
}
