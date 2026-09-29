export type MediaSourceKind = "empty" | "library-image" | "library-video" | "library-file" | "bilibili" | "youtube" | "local" | "external";
export type MediaSource = { kind: MediaSourceKind; name: string; detail: string };

const IMAGE_EXTENSION = /\.(jpe?g|png|webp|gif|avif|svg)$/i;
const VIDEO_EXTENSION = /\.(mp4|webm|mov|avi|m4v|ogv)$/i;
const LIBRARY_HOST_SUFFIX = ".blob.vercel-storage.com";

function lastSegment(pathname: string): string {
  const segment = pathname.split("/").filter(Boolean).pop() ?? pathname;
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

// 把媒体地址转成界面可读的名称，替代直接展示原始 URL
export function describeMediaSource(value: string): MediaSource {
  let raw = value.trim();
  if (!raw) return { kind: "empty", name: "未设置", detail: "" };

  const iframeSrc = raw.match(/src=["']([^"']+)["']/)?.[1];
  if (iframeSrc) raw = iframeSrc;
  if (raw.startsWith("//")) raw = `https:${raw}`;

  if (raw.startsWith("/")) {
    return { kind: "local", name: lastSegment(raw.split(/[?#]/, 1)[0] ?? raw), detail: "站内文件" };
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { kind: "external", name: raw, detail: "外部链接" };
  }

  const host = url.hostname.toLowerCase();

  if (host.endsWith(LIBRARY_HOST_SUFFIX)) {
    const name = lastSegment(url.pathname);
    const kind = VIDEO_EXTENSION.test(name) ? "library-video" : IMAGE_EXTENSION.test(name) ? "library-image" : "library-file";
    return { kind, name, detail: "媒体库" };
  }

  if (host === "b23.tv" || host === "bilibili.com" || host.endsWith(".bilibili.com")) {
    const bvid = url.pathname.match(/\/video\/(BV[a-zA-Z0-9]+)/)?.[1] ?? url.searchParams.get("bvid");
    return { kind: "bilibili", name: bvid ? `Bilibili · ${bvid}` : `Bilibili · ${host}${url.pathname}`, detail: "嵌入链接" };
  }

  if (host === "youtu.be" || host === "youtube.com" || host.endsWith(".youtube.com")) {
    const id = host === "youtu.be"
      ? url.pathname.split("/").filter(Boolean)[0]
      : url.searchParams.get("v") ?? url.pathname.match(/\/embed\/([^/?]+)/)?.[1];
    if (id) return { kind: "youtube", name: `YouTube · ${id}`, detail: "嵌入链接" };
  }

  return { kind: "external", name: host, detail: "外部链接" };
}
