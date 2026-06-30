"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
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
  const [scrollProgress, setScrollProgress] = useState(0);
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
    function getScrollContainer() {
      return document.querySelector("div.h-screen") || document.documentElement;
    }

    function handleScroll() {
      const container = getScrollContainer();
      const scrollTop = container === document.documentElement ? window.scrollY : (container as HTMLElement).scrollTop;
      const heroHeight = window.innerHeight;
      if (scrollTop <= heroHeight) {
        setParallaxY(scrollTop * 0.4);
        setScrollProgress(scrollTop / heroHeight);
      }
    }

    const container = getScrollContainer();
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
        />
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
              className={`w-full h-full object-cover scale-110 transition-opacity duration-1000 ${
                isVideoReady ? "opacity-100" : "opacity-0"
              }`}
              style={{ filter: `blur(4px) brightness(${0.5 - scrollProgress * 0.3})` }}
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
        <div className="absolute bottom-16 md:bottom-24 left-8 md:left-24 z-10 text-left">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-normal tracking-tight mb-3" style={{ fontFamily: "var(--font-montserrat)" }}>
            {siteConfig.name}
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl text-zinc-400 font-light" style={{ fontFamily: "var(--font-montserrat)" }}>
            {siteConfig.title}
          </p>
        </div>
        
        <button
          onClick={() => {
            const container = document.querySelector("div.h-screen");
            const works = document.getElementById("works");
            if (works) {
              if (container) {
                const worksTop = works.offsetTop;
                const target = worksTop * 0.90;
                container.dispatchEvent(
                  new CustomEvent("smooth-scroll-to", { detail: { target } })
                );
              } else {
                const worksTop = works.offsetTop;
                window.scrollTo({ top: worksTop * 0.90, behavior: "smooth" });
              }
            }
          }}
          className="group absolute bottom-16 md:bottom-20 right-1/2 translate-x-1/2 md:right-20 md:translate-x-0 z-10 text-[13px] md:text-sm lg:text-base xl:text-lg pt-3 md:pt-3.5 pb-2 md:pb-2.5 pl-4 md:pl-5 pr-3 md:pr-4 hover:pr-5 md:hover:pr-6 text-zinc-300 hover:text-white transition-all duration-300 cursor-pointer border border-zinc-400 hover:border-white flex items-center gap-2"
          style={{ fontFamily: "'Bitcount Grid Single', sans-serif", opacity: Math.max(0, 1 - scrollProgress * 2.5), pointerEvents: scrollProgress > 0.45 ? "none" as const : "auto" as const }}
        >
          跳转至 works.
          <ArrowRight className="w-3 h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </button>
      </section>
    </>
  );
}
