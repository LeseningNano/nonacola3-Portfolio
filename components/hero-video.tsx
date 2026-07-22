"use client";

import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { ArrowRight } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { LoadingScreen } from "./loading-screen";
import { SCROLL_CONTAINER_ID } from "./home-client";

export function HeroVideo({ videoUrl }: { videoUrl: string | null }) {
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [loaderVisible, setLoaderVisible] = useState(false);
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const loadTriggered = useRef(false);
  const rafId = useRef(0);
  const introDoneRef = useRef(false);
  const nudgeRaf = useRef(0);

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
      if (buttonRef.current) {
        const baseFade = Math.max(0, 1 - progress * 2.5);
        buttonRef.current.style.opacity = introDoneRef.current ? String(baseFade) : "0";
        buttonRef.current.style.pointerEvents =
          introDoneRef.current && progress <= 0.45 ? "auto" : "none";
      }
    }

    function onScroll() {
      if (!rafId.current) rafId.current = requestAnimationFrame(apply);
    }

    const container = document.getElementById(SCROLL_CONTAINER_ID);
    // 移动端容器不滚动，监听 window；md+ 监听容器
    const isContainerScroll = container && container.clientHeight < container.scrollHeight;
    const target: HTMLElement | Window = isContainerScroll ? container! : window;
    target.addEventListener("scroll", onScroll, { passive: true });
    // 移动端可能因 resize 切换滚动主体，兜底监听 window
    if (isContainerScroll) window.addEventListener("scroll", onScroll, { passive: true });

    // 刷新/后续进入：跳过开场动画，按钮直接显示
    if (sessionStorage.getItem("hero-loaded")) introDoneRef.current = true;
    apply();

    return () => {
      target.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId.current);
      cancelAnimationFrame(nudgeRaf.current);
    };
  }, []);

  // 加载层显隐：用 useLayoutEffect 在浏览器首帧绘制前决定，
  // 避免内容在首访时于加载层淡入前闪现。
  // - 刷新/返回（sessionStorage 有 hero-loaded）：无 pre-loader、加载层立即卸载，内容直显。
  // - 首访：inline <head> 脚本已注入 #pre-loader 在 SSR 绘制期间盖住内容；
  //   此处设 loaderVisible=true（瞬时，无 transition）让 React 接管覆盖，移除 pre-loader。
  useLayoutEffect(() => {
    if (sessionStorage.getItem("hero-loaded")) {
      setShowLoader(false);
      return;
    }
    // 首访：淡入加载层（200ms），pre-loader 在淡入完成后才移除，
    // 期间两者同为黑色，pre-loader 兜底盖住内容直到 React 加载层完全显形。
    requestAnimationFrame(() => setLoaderVisible(true));
    setTimeout(() => {
      const p = document.getElementById("pre-loader");
      if (p) p.remove();
    }, 260);
  }, []);

  // 开场轻推：复用滚轮的指数追逐动画通道，轻推一下示意可滑动，随后按钮淡入。
  // 仅首次进入触发。与滚轮体感完全一致（同一段 rAF 动画代码、同一 easing）。
  const playNudge = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 768px)").matches;
    const container = document.getElementById(SCROLL_CONTAINER_ID);
    if (reduce || mobile || !container) {
      finishIntro();
      return;
    }
    const peak = 320;
    const pauseMs = 500;
    const easing = 10; // 与滚轮一致

    const dispatch = (target: number) => {
      container.dispatchEvent(
        new CustomEvent("smooth-scroll-to", { detail: { target, easing } })
      );
    };
    const getY = () => container.scrollTop;

    let phase: "down" | "pause" | "up" = "down";
    let pauseStart = 0;
    // 容差：滚轮动画在差值 <0.5px 时判定结束
    const EPS = 1;
    dispatch(peak);

    const frame = (now: number) => {
      if (phase === "down") {
        if (Math.abs(getY() - peak) < EPS) {
          phase = "pause";
          pauseStart = now;
        }
      } else if (phase === "pause") {
        if (now - pauseStart >= pauseMs) {
          phase = "up";
          dispatch(0);
        }
      } else {
        if (Math.abs(getY()) < EPS) {
          finishIntro();
          return;
        }
      }
      nudgeRaf.current = requestAnimationFrame(frame);
    };
    nudgeRaf.current = requestAnimationFrame(frame);
  };

  const finishIntro = () => {
    introDoneRef.current = true;
    if (buttonRef.current) {
      buttonRef.current.style.transition = "opacity 700ms ease";
      buttonRef.current.style.opacity = "1";
      buttonRef.current.style.pointerEvents = "auto";
      setTimeout(() => {
        if (buttonRef.current) buttonRef.current.style.transition = "";
      }, 720);
    }
  };

  // After loading screen finishes, fade out + 触发开场轻推
  const handleLoadReady = () => {
    if (!loadTriggered.current) {
      loadTriggered.current = true;
      sessionStorage.setItem("hero-loaded", "1");
      setFadeOut(true);
      setTimeout(() => {
        setShowLoader(false);
        playNudge();
      }, 450);
    }
  };

  return (
    <>
      {/* Full-screen loading overlay */}
      {showLoader && (
        <div
          className="fixed inset-0 z-[9999]"
          style={{
            opacity: fadeOut ? 0 : loaderVisible ? 1 : 0,
            transition: "opacity 200ms ease",
            pointerEvents: loaderVisible && !fadeOut ? "auto" : "none",
          }}
        >
          <LoadingScreen ready={isVideoReady || !videoUrl} onReady={handleLoadReady} />
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
        <div ref={contentRef} className="absolute bottom-28 md:bottom-28 left-6 md:left-20 z-10 text-left" style={{ fontFamily: "var(--font-montserrat), sans-serif" }}>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-normal tracking-tight mb-3">
            {siteConfig.name}
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl text-neutral-400 font-light">
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
          className="group absolute bottom-12 md:bottom-28 right-1/2 translate-x-1/2 md:right-24 md:translate-x-0 z-10 text-xs md:text-sm lg:text-base xl:text-lg pt-3 md:pt-3.5 pb-2 md:pb-2.5 pl-4 md:pl-5 pr-3 md:pr-4 hover:pr-5 md:hover:pr-6 text-neutral-300 hover:text-white transition-all duration-300 cursor-pointer border border-neutral-400 hover:border-white flex items-center gap-2"
        >
          <span>跳转至 </span><span className="font-heading">works.</span>
          <ArrowRight className="w-3 h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </button>
      </section>
    </>
  );
}
