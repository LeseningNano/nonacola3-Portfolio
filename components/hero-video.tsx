"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { LoadingScreen } from "./loading-screen";
import { SCROLL_CONTAINER_ID } from "./home-client";

export function HeroVideo({ videoUrl }: { videoUrl: string | null }) {
  const [isVideoReady, setIsVideoReady] = useState(false);
  // 加载动画只在本次会话首次进入时显示
  const [showLoader, setShowLoader] = useState(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("hero-loaded")) {
      return false;
    }
    return true;
  });
  const [fadeOut, setFadeOut] = useState(false);
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const loadTriggered = useRef(false);
  const rafId = useRef(0);

  // Parallax + scroll-driven styles: write to DOM directly, no React re-render
  useEffect(() => {
    function getScrollTop() {
      const container = document.getElementById(SCROLL_CONTAINER_ID);
      if (container) return container.scrollTop;
      return window.scrollY;
    }

    function apply() {
      rafId.current = 0;
      const scrollTop = getScrollTop();
      const heroHeight = window.innerHeight;
      if (scrollTop > heroHeight) return;

      const progress = scrollTop / heroHeight;

      if (videoWrapRef.current) {
        videoWrapRef.current.style.transform = `translateY(${scrollTop * 0.4}px)`;
      }
      if (videoRef.current) {
        videoRef.current.style.filter = `blur(4px) brightness(${0.5 - progress * 0.3})`;
      }
      const fade = Math.max(0, 1 - progress * 2.5);
      if (contentRef.current) {
        contentRef.current.style.opacity = String(fade);
      }
      if (buttonRef.current) {
        buttonRef.current.style.opacity = String(fade);
        buttonRef.current.style.pointerEvents = progress > 0.45 ? "none" : "auto";
      }
    }

    function onScroll() {
      if (!rafId.current) rafId.current = requestAnimationFrame(apply);
    }

    const container = document.getElementById(SCROLL_CONTAINER_ID);
    const target: HTMLElement | Window = container ?? window;
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      target.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  // After loading screen finishes, fade out
  const handleLoadReady = () => {
    if (!loadTriggered.current) {
      loadTriggered.current = true;
      sessionStorage.setItem("hero-loaded", "1");
      setFadeOut(true);
      setTimeout(() => setShowLoader(false), 500);
    }
  };

  return (
    <>
      {/* Full-screen loading overlay */}
      {showLoader && (
        <LoadingScreen ready={isVideoReady || !videoUrl} onReady={handleLoadReady} />
      )}

      <section id="hero" className="relative h-screen w-full overflow-hidden bg-[#0a0a0a]">
        {/* Background / Video Layer */}
        <div
          ref={videoWrapRef}
          className="absolute z-0"
          style={{
            top: "-10%",
            left: "-5%",
            right: "-5%",
            bottom: "-10%",
            willChange: "transform",
          }}
        >
          {videoUrl ? (
            <video
              ref={videoRef}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              onCanPlay={() => setIsVideoReady(true)}
              className={`w-full h-full object-cover scale-110 transition-opacity duration-1000 ${
                isVideoReady ? "opacity-100" : "opacity-0"
              }`}
              style={{ filter: "blur(4px) brightness(0.5)" }}
              src={videoUrl}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-neutral-900 to-[#0a0a0a]" />
          )}
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
        <div ref={contentRef} className="absolute bottom-20 md:bottom-28 left-4 md:left-20 z-10 text-left">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-normal tracking-tight mb-3" style={{ fontFamily: "var(--font-montserrat)" }}>
            {siteConfig.name}
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl text-neutral-400 font-light" style={{ fontFamily: "var(--font-montserrat)" }}>
            {siteConfig.title}
          </p>
        </div>

        <button
          ref={buttonRef}
          onClick={() => {
            const works = document.getElementById("works");
            if (!works) return;
            const container = document.getElementById(SCROLL_CONTAINER_ID);
            const target = works.offsetTop * 0.9;
            if (container) {
              container.dispatchEvent(
                new CustomEvent("smooth-scroll-to", { detail: { target } })
              );
            } else {
              window.scrollTo({ top: target, behavior: "smooth" });
            }
          }}
          className="group absolute bottom-20 md:bottom-28 right-1/2 translate-x-1/2 md:right-24 md:translate-x-0 z-10 text-[13px] md:text-sm lg:text-base xl:text-lg pt-3 md:pt-3.5 pb-2 md:pb-2.5 pl-4 md:pl-5 pr-3 md:pr-4 hover:pr-5 md:hover:pr-6 text-neutral-300 hover:text-white transition-all duration-300 cursor-pointer border border-neutral-400 hover:border-white flex items-center gap-2"
          style={{ fontFamily: "var(--font-bitcount)" }}
        >
          跳转至 works.
          <ArrowRight className="w-3 h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </button>
      </section>
    </>
  );
}
