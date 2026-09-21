import type { Nodes } from "mdast";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfm } from "micromark-extension-gfm";
import { parseFragment } from "parse5";

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

export type MediaFile = {
  url: string;
  pathname: string;
  size: number;
  sizeMB: string;
  references: MediaReference[];
};

export type MediaLibraryFilter = "all" | "image" | "video" | "unused";

export type MediaLibraryState = {
  files: MediaFile[];
  snapshot: MediaFile[] | null;
  deletingUrl: string | null;
  error: string | null;
  retryFile?: MediaFile | null;
};

export type MediaLibraryEvent =
  | { type: "delete-start"; url: string }
  | { type: "delete-success" }
  | { type: "delete-error"; message: string }
  | { type: "replace-files"; files: MediaFile[] };

type ManagedBlob = {
  url: string;
  downloadUrl: string;
  pathname: string;
  size: number;
  uploadedAt: Date;
  etag: string;
};

type ManagedBlobListPage = {
  blobs: ManagedBlob[];
  cursor?: string;
  hasMore: boolean;
};

type ManagedBlobList = (options?: {
  cursor?: string;
  limit?: number;
}) => Promise<ManagedBlobListPage>;

const managedBlobHostSuffix = ".public.blob.vercel-storage.com";
const imageExtensions = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif", "svg"]);
const videoExtensions = new Set(["mp4", "webm", "mov", "avi", "m4v", "ogv"]);

type HtmlNode = {
  attrs?: Array<{ name: string; value: string }>;
  childNodes?: HtmlNode[];
};

function extractHtmlAttributeUrls(html: string): string[] {
  const urls: string[] = [];
  const fragment = parseFragment(html) as unknown as HtmlNode;

  function visit(node: HtmlNode): void {
    for (const attribute of node.attrs ?? []) {
      if (attribute.name !== "src" && attribute.name !== "href") continue;
      urls.push(attribute.value);
    }

    for (const child of node.childNodes ?? []) visit(child);
  }

  visit(fragment);
  return urls;
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

  const markdown = text;
  const urls: string[] = [];
  const tree = fromMarkdown(markdown, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  });
  const definitions = new Map<string, string>();

  function collectDefinitions(node: Nodes): void {
    if (node.type === "definition") {
      const identifier = node.identifier.toUpperCase();
      if (!definitions.has(identifier)) definitions.set(identifier, node.url);
    }
    if ("children" in node) {
      for (const child of node.children) collectDefinitions(child);
    }
  }

  collectDefinitions(tree);

  function add(candidate: string): void {
    const normalized = normalizeManagedBlobUrl(candidate);
    if (normalized) urls.push(normalized);
  }

  function visit(node: Nodes): void {
    if (node.type === "link") {
      add(node.url);
    }
    if (node.type === "image") {
      add(node.url);
      return;
    }
    if (node.type === "linkReference") {
      const destination = definitions.get(node.identifier.toUpperCase());
      if (destination) add(destination);
    }
    if (node.type === "imageReference") {
      const destination = definitions.get(node.identifier.toUpperCase());
      if (destination) add(destination);
      return;
    }
    if (node.type === "html") {
      for (const candidate of extractHtmlAttributeUrls(node.value)) add(candidate);
      return;
    }
    if ("children" in node) {
      for (const child of node.children) visit(child);
    }
  }

  visit(tree);

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

function mediaKind(pathname: string): "image" | "video" | null {
  const cleanPathname = pathname.split(/[?#]/, 1)[0] ?? "";
  const extension = cleanPathname.split(".").pop()?.toLowerCase() ?? "";
  if (imageExtensions.has(extension)) return "image";
  if (videoExtensions.has(extension)) return "video";
  return null;
}

export function filterMediaFiles(
  files: MediaFile[],
  filter: MediaLibraryFilter,
  query: string,
): MediaFile[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return files.filter((file) => {
    if (normalizedQuery && !file.pathname.toLocaleLowerCase().includes(normalizedQuery)) return false;
    if (filter === "unused") return file.references.length === 0;
    return filter === "all" || mediaKind(file.pathname) === filter;
  });
}

export function reduceMediaLibraryState(
  state: MediaLibraryState,
  event: MediaLibraryEvent,
): MediaLibraryState {
  switch (event.type) {
    case "delete-start":
      return {
        files: state.files.filter((file) => file.url !== event.url),
        snapshot: state.files,
        deletingUrl: event.url,
        error: null,
        retryFile: null,
      };
    case "delete-success":
      return { ...state, snapshot: null, deletingUrl: null, error: null, retryFile: null };
    case "delete-error":
      return {
        files: state.snapshot ?? state.files,
        snapshot: null,
        deletingUrl: null,
        error: event.message,
        retryFile: state.snapshot?.find((file) => file.url === state.deletingUrl) ?? null,
      };
    case "replace-files":
      if (state.deletingUrl) return state;
      return { files: event.files, snapshot: null, deletingUrl: null, error: null, retryFile: null };
  }
}

export async function collectAllManagedBlobs(
  listFn: ManagedBlobList,
): Promise<ManagedBlob[]> {
  const blobs: ManagedBlob[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | undefined;

  while (true) {
    const page = await listFn({ cursor, limit: 1000 });
    blobs.push(...page.blobs);

    if (!page.hasMore) return blobs;
    if (!page.cursor || seenCursors.has(page.cursor)) {
      throw new Error("Blob listing returned a repeated Blob cursor");
    }

    seenCursors.add(page.cursor);
    cursor = page.cursor;
  }
}
