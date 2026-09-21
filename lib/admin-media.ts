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

const httpUrlStart = /https?:\/\//gi;
const terminalProsePunctuation = new Set([
  ".", ",", "。", "，",
]);

function delimiterBalance(value: string, opening: string, closing: string): number {
  let balance = 0;

  for (const character of value) {
    if (character === opening) balance += 1;
    if (character === closing) balance -= 1;
  }

  return balance;
}

function removeEnclosingDelimiter(
  value: string,
  opening: string | undefined,
): string {
  if (opening !== "(" && opening !== "[") return value;
  const closing = opening === "(" ? ")" : "]";

  let candidate = value;
  while (
    candidate.endsWith(closing)
    && delimiterBalance(candidate, opening, closing) < 0
  ) {
    candidate = candidate.slice(0, -1);
  }

  return candidate;
}

function htmlAttributeContext(
  text: string,
  start: number,
): "supported" | "unsupported" | null {
  const tagStart = text.lastIndexOf("<", start - 1);
  const tagEnd = text.lastIndexOf(">", start - 1);
  if (tagStart <= tagEnd || tagStart === start - 1) return null;

  const prefix = text.slice(tagStart + 1, start);
  return /(?:^|\s)(?:src|href)\s*=\s*["']?$/i.test(prefix)
    ? "supported"
    : "unsupported";
}

function extractUrlCandidate(
  text: string,
  start: number,
  preserveTerminalPunctuation: boolean,
): string {
  let end = start;
  while (end < text.length && !/[\s<>"']/.test(text[end])) end += 1;

  let candidate = text.slice(start, end);
  if (!preserveTerminalPunctuation) {
    while (terminalProsePunctuation.has(candidate.at(-1) ?? "")) {
      candidate = candidate.slice(0, -1);
    }
  }

  return removeEnclosingDelimiter(candidate, text[start - 1]);
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

  for (const match of text.matchAll(httpUrlStart)) {
    const start = match.index;
    if (start > 0 && /[\p{L}\p{N}_+-]/u.test(text[start - 1])) continue;

    const htmlContext = htmlAttributeContext(text, start);
    if (htmlContext === "unsupported") continue;

    const opening = text[start - 1];
    const preserveTerminalPunctuation = htmlContext === "supported"
      || opening === '"'
      || opening === "'"
      || opening === "<";
    const candidate = extractUrlCandidate(text, start, preserveTerminalPunctuation);
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
