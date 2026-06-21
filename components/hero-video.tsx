"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { siteConfig } from "@/lib/config";

export function HeroVideo() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isFetched, setIsFetched] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [barProgress, setBarProgress] = useState(0);
  const [parallaxY, setParallaxY] = useState(0);

  useEffect(() => {
    fetch("/api/hero")
      .then((res) => res.json())
      .then((data) => {
        if (data?.blobUrl) {
          setVideoUrl(data.blobUrl);
        }
      })
      .finally(() => {
        setIsFetched(true);
      });
  }, []);

  // Parallax effect: video moves slower than scroll
  useEffect(() => {
    const container = document.querySelector("div.h-screen");
    if (!container) return;

    function handleScroll() {
      const scrollTop = container!.scrollTop;
      const heroHeight = container!.clientHeight;
      // Only apply within hero section range
      if (scrollTop <= heroHeight) {
        setParallaxY(scrollTop * 0.4);
      }
    }

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Simulate loading progress
  useEffect(() => {
    if (isVideoReady) {
      setBarProgress(100);
      return;
    }
    const timers = [
      setTimeout(() => setBarProgress(30), 300),
      setTimeout(() => setBarProgress(55), 800),
      setTimeout(() => setBarProgress(75), 1500),
      setTimeout(() => setBarProgress(90), 2500),
    ];
    // Fallback: if video doesn't load within 5s, finish anyway
    const fallback = setTimeout(() => {
      setBarProgress(100);
    }, 5000);
    return () => { timers.forEach(clearTimeout); clearTimeout(fallback); };
  }, [isVideoReady]);

  // After bar reaches 100%, wait briefly then fade out
  useEffect(() => {
    if (barProgress >= 100) {
      const timer = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          setShowLoader(false);
        }, 400);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [barProgress]);

  return (
    <>
      {/* Full-screen loading overlay */}
      {showLoader && (
        <div
          key="loader"
          data-hero-loader
          className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0a0a] transition-opacity duration-500 ${
            fadeOut ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="w-screen h-[2px] bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-white origin-center"
              style={{
                transform: `scaleX(${barProgress / 100})`,
                transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          </div>
        </div>
      )}

      <section id="hero" className="relative h-screen w-full overflow-hidden bg-[#0a0a0a]">
        {/* Background / Video Layer */}
        <div
          className="absolute z-0"
          style={{
            top: "-10%",
            left: "-5%",
            right: "-5%",
            bottom: "-10%",
            transform: `translateY(${parallaxY}px)`,
            willChange: "transform",
          }}
        >
          {videoUrl ? (
            <video
              autoPlay
              loop
              muted
              playsInline
              onCanPlay={() => setIsVideoReady(true)}
              className={`w-full h-full object-cover transition-opacity duration-1000 ${
                isVideoReady ? "opacity-100" : "opacity-0"
              }`}
              src={videoUrl}
            />
          ) : isFetched ? (
            <div className="w-full h-full bg-gradient-to-b from-zinc-900 to-[#0a0a0a]" />
          ) : null}
        </div>

        {/* Gradient Mask Layer */}
        <div className="absolute inset-0 z-[2] bg-black/50 pointer-events-none" />

        {/* Content Layer */}
        <div className="relative z-10 flex flex-col items-start justify-center h-full text-left w-full px-6 md:px-16 lg:px-32 xl:px-48">
          <h1 className="text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight mb-6 font-[family-name:var(--font-montserrat)]">
            {siteConfig.name}
          </h1>
          <p className="text-2xl md:text-3xl lg:text-4xl text-zinc-400 font-light">
            {siteConfig.title}
          </p>
        </div>
        
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce pointer-events-none">
          <ChevronDown className="w-8 h-8 text-zinc-400" />
        </div>
      </section>
    </>
  );
}
