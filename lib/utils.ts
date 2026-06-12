import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getEmbedUrl(url: string): string {
  // If user pasted full iframe code, extract the src attribute
  const iframeMatch = url.match(/src=["'](.*?)["']/);
  if (iframeMatch) {
    url = iframeMatch[1];
  }

  // Ensure protocol is present if it starts with //
  if (url.startsWith("//")) {
    url = `https:${url}`;
  }

  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/
  );
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }

  const biliMatch = url.match(
    /bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/
  );
  if (biliMatch) {
    return `https://player.bilibili.com/player.html?bvid=${biliMatch[1]}&quality=116&as_wide=1&danmaku=0`;
  }

  // If it's a Bilibili player URL, add some default parameters to make it look better
  if (url.includes("player.bilibili.com/player.html")) {
    if (!url.includes("quality=116")) url += "&quality=116";
    if (!url.includes("as_wide=1")) url += "&as_wide=1";
    if (!url.includes("danmaku=0")) url += "&danmaku=0";
  }

  return url;
}
