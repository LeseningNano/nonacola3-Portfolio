"use client";

import { useEffect, useRef, useState, useLayoutEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { SCROLL_CONTAINER_ID } from "./home-client";

export function HeroVideo({ videoUrl }: { videoUrl: string | null }) {
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [introFading, setIntroFading] = useState(false);
  const [introIn, setIntroIn] = useState(false);
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const rafId = useRef(0);

  // Parallax + scroll-driven styles: write to DOM directly, no React re-render
  useLayoutEffect(() => {
    function getScrollTop() {
      const container = document.getElementById(SCROLL_CONTAINER_ID);
      // 容器仅在 md+ 是滚动元素；移动端由 window 滚动
      if (container && container.clientHeight < container.scrollHeight) {
        return container.scrollTop;
      }
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
      if (ctaRef.current) {
        ctaRef.current.style.opacity = String(fade);
        ctaRef.current.style.pointerEvents =
          progress <= 0.45 ? "auto" : "none";
      }
    }

    function onScroll() {
      if (!rafId.current) rafId.current = requestAnimationFrame(apply);
    }

    const container = document.getElementById(SCROLL_CONTAINER_ID);
    const isContainerScroll = container && container.clientHeight < container.scrollHeight;
    const target: HTMLElement | Window = isContainerScroll ? container! : window;
    target.addEventListener("scroll", onScroll, { passive: true });
    if (isContainerScroll) window.addEventListener("scroll", onScroll, { passive: true });

    apply();

    return () => {
      target.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  // Logo 入场层显隐：pre-loader 黑底兜底期间由 React 接管。
  // 回访（sessionStorage 有 hero-loaded）直接跳过。
  useLayoutEffect(() => {
    if (sessionStorage.getItem("hero-loaded")) {
      setShowIntro(false);
      return;
    }
    requestAnimationFrame(() => setIntroIn(true));
    setTimeout(() => {
      const p = document.getElementById("pre-loader");
      if (p) p.remove();
    }, 260);
  }, []);

  // 时间线：淡入 500ms → 停留 400ms → 淡出 450ms → 卸载并写入回访标记
  useEffect(() => {
    if (!showIntro || !introIn || introFading) return;
    const t1 = setTimeout(() => setIntroFading(true), 900);
    const t2 = setTimeout(() => {
      sessionStorage.setItem("hero-loaded", "1");
      setShowIntro(false);
    }, 1350);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [showIntro, introIn, introFading]);

  return (
    <>
      {/* Logo 入场层 */}
      {showIntro && (
        <div
          className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex items-center justify-center"
          style={{
            opacity: introFading ? 0 : introIn ? 1 : 0,
            transition: introFading ? "opacity 450ms ease" : introIn ? "opacity 500ms ease" : "none",
            pointerEvents: introFading ? "none" : "auto",
          }}
        >
          <span className="text-3xl md:text-5xl text-white tracking-tight" style={{ fontFamily: "var(--font-bitcount)" }}>
            {siteConfig.name}
          </span>
        </div>
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
        <div ref={contentRef} className="absolute bottom-28 md:bottom-28 left-4 md:left-20 z-10 text-left">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-normal tracking-tight mb-3" style={{ fontFamily: "var(--font-montserrat)" }}>
            {siteConfig.name}
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl text-neutral-400 font-light" style={{ fontFamily: "var(--font-montserrat)" }}>
            {siteConfig.title}
          </p>
        </div>

        <Link
          ref={ctaRef}
          href="/works"
          className="group absolute bottom-12 md:bottom-28 right-1/2 translate-x-1/2 md:right-24 md:translate-x-0 z-10 text-[13px] md:text-sm lg:text-base xl:text-lg pt-3 md:pt-3.5 pb-2 md:pb-2.5 pl-4 md:pl-5 pr-3 md:pr-4 hover:pr-5 md:hover:pr-6 text-neutral-300 hover:text-white transition-all duration-300 cursor-pointer border border-neutral-400 hover:border-white flex items-center gap-2"
          style={{ fontFamily: "var(--font-bitcount)" }}
        >
          跳转至 works.
          <ArrowRight className="w-3 h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      </section>
    </>
  );
}
