"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { useState } from "react";
import { getEmbedUrl } from "@/lib/utils";
import { useWorksLanguage } from "./works-language-provider";

interface ShowreelFeatureProps {
  showreelUrl: string;
  videoType: "url" | "upload";
}

export function ShowreelFeature({ showreelUrl, videoType }: ShowreelFeatureProps) {
  const [active, setActive] = useState(false);
  const { copy } = useWorksLanguage();
  const embedSrc = getEmbedUrl(showreelUrl);
  const separator = embedSrc.includes("?") ? "&" : "?";

  return (
    <section aria-labelledby="showreel-heading" className="border-t border-white/10 pt-6 md:pt-8">
      <div className="relative aspect-video overflow-hidden bg-black">
        {active ? (
          videoType === "upload" ? (
            <video src={showreelUrl} controls autoPlay playsInline className="h-full w-full object-contain" />
          ) : (
            <iframe
              src={`${embedSrc}${separator}autoplay=1&mute=1&muted=1`}
              title={copy.showreel.frameTitle}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          )
        ) : (
          <button
            type="button"
            aria-label={copy.showreel.playLabel}
            onClick={() => setActive(true)}
            className="group absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
          >
            <Image
              src="/hero-poster.webp"
              alt=""
              fill
              preload
              sizes="(max-width: 639px) calc(100vw - 40px), (max-width: 767px) calc(100vw - 64px), (max-width: 1199px) calc(100vw - 96px), 1104px"
              className="object-cover transition-transform duration-500 motion-reduce:transition-none md:group-hover:scale-[1.015]"
            />
            <span className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/15" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/60 bg-black/35 backdrop-blur-sm transition-transform duration-300 motion-reduce:transition-none md:group-hover:scale-105">
                <Play aria-hidden="true" className="ml-1 h-6 w-6 fill-white text-white" />
              </span>
            </span>
          </button>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs tracking-[0.28em] text-neutral-400">{copy.showreel.label}</p>
          <h2 id="showreel-heading" className="mt-2 text-xl text-white md:text-2xl">
            {copy.showreel.title}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-400">
            {copy.showreel.description}
          </p>
        </div>
        <p className="text-sm tabular-nums text-neutral-400">01:03</p>
      </div>
    </section>
  );
}
