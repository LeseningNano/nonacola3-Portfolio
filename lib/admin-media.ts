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

const managedBlobHostSuffix = ".public.blob.vercel-storage.com";

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
