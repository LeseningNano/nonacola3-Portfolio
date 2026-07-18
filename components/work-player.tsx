"use client";

import { getEmbedUrl } from "@/lib/utils";
import { VtTarget } from "./vt-target";

export function WorkPlayer({
  videoId,
  embedUrl,
  title,
}: {
  videoId: string;
  embedUrl: string;
  title: string;
}) {
  const src = getEmbedUrl(embedUrl);
  const sep = src.includes("?") ? "&" : "?";
  return (
    <VtTarget name={`video-${videoId}`} className="aspect-video w-full overflow-hidden bg-black">
      <iframe
        src={`${src}${sep}mute=1&muted=1`}
        title={title}
        className="w-full h-full"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
    </VtTarget>
  );
}
