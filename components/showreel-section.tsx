"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getEmbedUrl } from "@/lib/utils";

export function ShowreelVideo() {
  const [showreelUrl, setShowreelUrl] = useState<string | null>(null);
  const [videoType, setVideoType] = useState<"url" | "upload">("url");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/showreel")
      .then((res) => res.json())
      .then((data) => {
        if (data?.showreelUrl) setShowreelUrl(data.showreelUrl);
        if (data?.videoType) setVideoType(data.videoType);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section id="showreel" className="w-full h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </section>
    );
  }

  if (!showreelUrl) return null;

  return (
    <section id="showreel" className="w-full h-screen bg-[#0a0a0a] flex items-center">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
        <div className="flex flex-col mb-5 md:mb-6">
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-white uppercase">
            Showreel
          </h2>
          <p className="text-base md:text-lg text-zinc-400 font-light mt-2">
            近期视频制作与视觉创作总结
          </p>
        </div>
        
        <div className="group relative aspect-video w-full rounded-xl overflow-hidden bg-black shadow-2xl border border-zinc-800 cursor-pointer">
          {videoType === "upload" ? (
            <video
              src={showreelUrl}
              controls
              autoPlay
              muted
              loop
              className="w-full h-full object-contain"
            />
          ) : (
            <>
              <iframe
                src={getEmbedUrl(showreelUrl)}
                className="w-full h-full"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 pointer-events-none flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all duration-300 border border-white/20 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>
                </div>
              </div>
              <a 
                href={showreelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 z-10"
              />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
