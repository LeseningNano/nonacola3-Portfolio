import type { VideoRow } from "@/lib/types";

export interface WorkYearGroup {
  label: string;
  works: VideoRow[];
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
