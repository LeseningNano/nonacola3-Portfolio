"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { useTransitionRouter } from "glimm/next";

export function HeroVideo() {
  const router = useTransitionRouter();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isFetched, setIsFetched] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [barProgress, setBarProgress] = useState(0);
  const [parallaxY, setParallaxY] = useState(0);
  const glimmTriggered = useRef(false);

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

  // After bar reaches 100%, trigger glimm then fade out
  useEffect(() => {
    if (barProgress >= 100 && !glimmTriggered.current) {
      glimmTriggered.current = true;
      const timer = setTimeout(() => {
        // Trigger glimm sweep as fade-out begins
        router.push("/");
        setFadeOut(true);
        setTimeout(() => {
          setShowLoader(false);
        }, 400);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [barProgress, router]);

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
              style={{ filter: "brightness(0.5)" }}
              src={videoUrl}
            />
          ) : isFetched ? (
            <div className="w-full h-full bg-gradient-to-b from-zinc-900 to-[#0a0a0a]" />
          ) : null}
        </div>

        {/* Halftone Texture Layer */}
        <div
          className="absolute inset-0 z-[3] pointer-events-none opacity-[0.5]"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.9) 0.3px, transparent 0.3px)",
            backgroundSize: "1.5px 1.5px",
            transform: "rotate(45deg) scale(3)",
          }}
        />

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

        <button
          onClick={() => {
            const container = document.querySelector("div.h-screen");
            const works = document.getElementById("works");
            if (container && works) {
              const worksTop = works.offsetTop;
              const target = worksTop * 0.90;
              container.dispatchEvent(
                new CustomEvent("smooth-scroll-to", { detail: { target } })
              );
            }
          }}
          className="absolute bottom-10 right-6 md:right-12 lg:right-16 z-10 text-white hover:text-zinc-300 transition-colors cursor-pointer border border-white hover:border-zinc-300 h-10 px-4 flex items-center text-[13px] leading-none"
          style={{ fontFamily: "'Bitcount Grid Single', sans-serif" }}
        >
          跳转至 works.
        </button>
      </section>
    </>
  );
}
