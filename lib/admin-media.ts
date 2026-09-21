import type { Nodes } from "mdast";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfm } from "micromark-extension-gfm";
import { parseEntities } from "parse-entities";
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

const terminalProsePunctuation = new Set([
  ".", ",", ";", ":", "!", "?", "。", "，", "；", "：", "！", "？",
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

function extractProseUrlCandidate(text: string, start: number): string {
  let end = start;
  while (end < text.length && !/[\s<>"']/.test(text[end])) end += 1;

  let candidate = text.slice(start, end);
  while (terminalProsePunctuation.has(candidate.at(-1) ?? "")) {
    candidate = candidate.slice(0, -1);
  }

  return removeEnclosingDelimiter(candidate, text[start - 1]);
}

type HtmlNode = {
  attrs?: Array<{ name: string }>;
  childNodes?: HtmlNode[];
  sourceCodeLocation?: {
    attrs?: Record<string, { startOffset: number; endOffset: number }>;
  } | null;
};

function rawHtmlAttributeValue(attribute: string): string | null {
  const equals = attribute.indexOf("=");
  if (equals === -1) return null;

  const value = attribute.slice(equals + 1).trimStart();
  const quote = value[0];
  if (quote === "\"" || quote === "'") {
    const end = value.lastIndexOf(quote);
    return end > 0 ? value.slice(1, end) : null;
  }

  const end = value.search(/[\s>]/);
  return end === -1 ? value : value.slice(0, end);
}

function extractHtmlAttributeUrls(html: string): string[] {
  const urls: string[] = [];
  const fragment = parseFragment(html, { sourceCodeLocationInfo: true }) as unknown as HtmlNode;

  function visit(node: HtmlNode): void {
    for (const attribute of node.attrs ?? []) {
      if (attribute.name !== "src" && attribute.name !== "href") continue;

      const location = node.sourceCodeLocation?.attrs?.[attribute.name];
      if (!location) continue;

      const rawValue = rawHtmlAttributeValue(
        html.slice(location.startOffset, location.endOffset),
      );
      if (rawValue === null) continue;

      urls.push(parseEntities(rawValue, {
        attribute: true,
        nonTerminated: false,
      }));
    }

    for (const child of node.childNodes ?? []) visit(child);
  }

  visit(fragment);
  return urls;
}

function isFormattingAncestor(node: Nodes): boolean {
  return node.type === "emphasis" || node.type === "strong" || node.type === "delete";
}

function markdownLinkCandidate(text: string, node: Extract<Nodes, { type: "link" }>, ancestors: Nodes[]): string {
  const start = node.position?.start.offset;
  const end = node.position?.end.offset;
  if (
    start !== undefined
    && end !== undefined
    && !ancestors.some(isFormattingAncestor)
    && text.slice(start, end).toLowerCase() === node.url.toLowerCase()
  ) {
    return extractProseUrlCandidate(text, start);
  }

  return node.url;
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

  function add(candidate: string): void {
    const normalized = normalizeManagedBlobUrl(candidate);
    if (normalized) urls.push(normalized);
  }

  function visit(node: Nodes, ancestors: Nodes[]): void {
    if (node.type === "link") {
      add(markdownLinkCandidate(markdown, node, ancestors));
      return;
    }
    if (node.type === "image") {
      add(node.url);
      return;
    }
    if (node.type === "html") {
      for (const candidate of extractHtmlAttributeUrls(node.value)) add(candidate);
      return;
    }
    if ("children" in node) {
      for (const child of node.children) visit(child, [...ancestors, node]);
    }
  }

  visit(tree, []);

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
