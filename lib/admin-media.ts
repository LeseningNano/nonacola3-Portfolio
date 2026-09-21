export type MediaReference = {
  kind: "hero" | "showreel" | "work-thumbnail" | "work-body" | "post-body";
  id: string;
  label: string;
  field: string;
};

export type MediaReferenceSnapshot = {
  hero: { blobUrl: string } | null;
  showreel: { showreelUrl: string; videoType: string } | null;
  videos: Array<{
    id: string;
    title: string;
    thumbnail: string | null;
    description: string | null;
  }>;
  posts: Array<{ id: string; title: string | null; body: string }>;
};

const managedBlobHostSuffix = ".public.blob.vercel-storage.com";

function parenthesisBalance(value: string): number {
  let balance = 0;

  for (const character of value) {
    if (character === "(") balance += 1;
    if (character === ")") balance -= 1;
  }

  return balance;
}

function removeEnclosingTrailingParentheses(value: string, prefix: string): string {
  if (!prefix.endsWith("(")) return value;

  const trailingParentheses = value.match(/\)+$/)?.[0].length ?? 0;
  const unbalancedClosingParentheses = Math.max(0, -parenthesisBalance(value));
  const delimiterCount = Math.min(trailingParentheses, unbalancedClosingParentheses);
  if (delimiterCount === 0) return value;

  const candidate = value.slice(0, -delimiterCount);
  return parenthesisBalance(candidate) === 0 ? candidate : value;
}

export function normalizeManagedBlobUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;

  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:"
      || url.username !== ""
      || url.password !== ""
      || !url.hostname.endsWith(managedBlobHostSuffix)
    ) {
      return null;
    }

    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}

export function extractHttpUrls(text: string | null): string[] {
  if (!text) return [];

  const urls: string[] = [];

  for (const match of text.matchAll(/https?:\/\/[^\s<>"']+/g)) {
    const value = match[0];
    const prefix = text.slice(0, match.index);
    const candidate = removeEnclosingTrailingParentheses(value, prefix);
    const normalized = normalizeManagedBlobUrl(candidate);
    if (normalized) urls.push(normalized);
  }

  return urls;
}

export function findMediaReferences(
  value: string,
  snapshot: MediaReferenceSnapshot,
): MediaReference[] {
  const url = normalizeManagedBlobUrl(value);
  if (!url) return [];

  const references: MediaReference[] = [];
  if (normalizeManagedBlobUrl(snapshot.hero?.blobUrl) === url) {
    references.push({ kind: "hero", id: "singleton", label: "Hero 背景视频", field: "blobUrl" });
  }

  if (
    snapshot.showreel?.videoType === "upload"
    && normalizeManagedBlobUrl(snapshot.showreel.showreelUrl) === url
  ) {
    references.push({ kind: "showreel", id: "singleton", label: "Showreel", field: "showreelUrl" });
  }

  for (const video of snapshot.videos) {
    if (normalizeManagedBlobUrl(video.thumbnail) === url) {
      references.push({ kind: "work-thumbnail", id: video.id, label: video.title, field: "thumbnail" });
    }
    if (extractHttpUrls(video.description).includes(url)) {
      references.push({ kind: "work-body", id: video.id, label: video.title, field: "description" });
    }
  }

  for (const post of snapshot.posts) {
    if (extractHttpUrls(post.body).includes(url)) {
      references.push({ kind: "post-body", id: post.id, label: post.title ?? "未命名动态", field: "body" });
    }
  }

  return references;
}

export function buildMediaReferenceIndex(
  urls: string[],
  snapshot: MediaReferenceSnapshot,
): Record<string, MediaReference[]> {
  return Object.fromEntries(urls.map((url) => [url, findMediaReferences(url, snapshot)]));
}
