"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

export function HeroVideo() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/hero")
      .then((res) => res.json())
      .then((data) => {
        if (data?.blobUrl) setVideoUrl(data.blobUrl);
      });
  }, []);

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {videoUrl ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          src={videoUrl}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-[#0a0a0a]" />
      )}
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-4">
          Your Name
        </h1>
        <p className="text-xl md:text-2xl text-zinc-400">
          Videographer &amp; Director
        </p>
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <ChevronDown className="w-8 h-8 text-zinc-400" />
      </div>
    </section>
  );
}
