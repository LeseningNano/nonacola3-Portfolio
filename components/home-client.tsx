"use client";

import { useEffect, useRef } from "react";
import { HeroVideo } from "@/components/hero-video";
import { VideoGrid } from "@/components/video-grid";

interface Video {
  id: string;
  title: string;
  description: string | null;
  summary: string | null;
  category: string;
  embedUrl: string;
  thumbnail: string | null;
  featured: boolean;
  order: number;
  date: string | null;
}

export const SCROLL_CONTAINER_ID = "main-scroll";

export function HomeClient({
  heroVideoUrl,
  videos,
}: {
  heroVideoUrl: string | null;
  videos: Video[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetScroll = useRef(0);
  const currentScroll = useRef(0);
  const rafId = useRef(0);
  const lastTime = useRef(0);
  const isAnimating = useRef(false);
  const scrollEasing = useRef(10);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 769px)");
    if (!mq.matches) return;

    const container = containerRef.current;
    if (!container) return;

    currentScroll.current = container.scrollTop;
    targetScroll.current = container.scrollTop;

    function animate(now: number) {
      const dt = Math.min((now - lastTime.current) / 1000, 0.1);
      lastTime.current = now;

      const diff = targetScroll.current - currentScroll.current;
      if (Math.abs(diff) < 0.5) {
        currentScroll.current = targetScroll.current;
        container!.scrollTop = targetScroll.current;
        isAnimating.current = false;
        rafId.current = 0;
        return;
      }

      const factor = 1 - Math.exp(-scrollEasing.current * dt);
      currentScroll.current += diff * factor;
      isAnimating.current = true;
      container!.scrollTop = currentScroll.current;
      rafId.current = requestAnimationFrame(animate);
    }

    function startAnimation() {
      if (!rafId.current) {
        currentScroll.current = container!.scrollTop;
        lastTime.current = performance.now();
        rafId.current = requestAnimationFrame(animate);
      }
    }

    function clampTarget(value: number) {
      const maxScroll = container!.scrollHeight - container!.clientHeight;
      targetScroll.current = Math.max(0, Math.min(maxScroll, value));
    }

    function handleWheel(e: WheelEvent) {
      // Let modals handle their own scrolling
      if ((e.target as HTMLElement).closest("[data-modal]")) return;
      e.preventDefault();
      scrollEasing.current = 10;
      clampTarget(targetScroll.current + e.deltaY * 1.5);
      startAnimation();
    }

    const KEY_SCROLLS: Record<string, number> = {
      ArrowDown: 120,
      ArrowUp: -120,
      PageDown: container.clientHeight * 0.9,
      PageUp: -container.clientHeight * 0.9,
      " ": container.clientHeight * 0.9,
    };

    function handleKeydown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "Home") {
        e.preventDefault();
        scrollEasing.current = 8;
        clampTarget(0);
        startAnimation();
        return;
      }
      if (e.key === "End") {
        e.preventDefault();
        scrollEasing.current = 8;
        clampTarget(container!.scrollHeight);
        startAnimation();
        return;
      }
      const delta = KEY_SCROLLS[e.key];
      if (delta !== undefined) {
        e.preventDefault();
        scrollEasing.current = 10;
        clampTarget(targetScroll.current + delta);
        startAnimation();
      }
    }

    function handleScroll() {
      if (isAnimating.current) return;
      currentScroll.current = container!.scrollTop;
      targetScroll.current = container!.scrollTop;
    }

    function handleSmoothScroll(e: Event) {
      const detail = (e as CustomEvent<{ target: number }>).detail;
      if (typeof detail?.target !== "number") return;
      scrollEasing.current = 8;
      clampTarget(detail.target);
      startAnimation();
    }

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("scroll", handleScroll, { passive: true });
    container.addEventListener("smooth-scroll-to", handleSmoothScroll);
    window.addEventListener("keydown", handleKeydown);
    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("scroll", handleScroll);
      container.removeEventListener("smooth-scroll-to", handleSmoothScroll);
      window.removeEventListener("keydown", handleKeydown);
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id={SCROLL_CONTAINER_ID}
      className="md:h-screen md:overflow-y-auto scrollbar-hide"
    >
      <HeroVideo videoUrl={heroVideoUrl} />
      <VideoGrid videos={videos} />
    </div>
  );
}
