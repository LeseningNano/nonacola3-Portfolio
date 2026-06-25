"use client";

import { useEffect, useRef } from "react";
import { HeroVideo } from "@/components/hero-video";
import { VideoGrid } from "@/components/video-grid";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetScroll = useRef(0);
  const currentScroll = useRef(0);
  const rafId = useRef(0);
  const lastTime = useRef(0);

  useEffect(() => {
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
        rafId.current = 0;
        return;
      }

      const factor = 1 - Math.exp(-10 * dt);
      currentScroll.current += diff * factor;
      container!.scrollTop = currentScroll.current;
      rafId.current = requestAnimationFrame(animate);
    }

    function handleWheel(e: WheelEvent) {
      e.preventDefault();

      // Sync with actual scroll position (handles middle-click drag, touch, etc.)
      currentScroll.current = container!.scrollTop;
      targetScroll.current = container!.scrollTop;

      const maxScroll = container!.scrollHeight - container!.clientHeight;
      targetScroll.current = Math.max(
        0,
        Math.min(maxScroll, targetScroll.current + e.deltaY * 1.5)
      );

      if (!rafId.current) {
        lastTime.current = performance.now();
        rafId.current = requestAnimationFrame(animate);
      }
    }

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <>
      <div ref={containerRef} className="h-screen overflow-y-auto scrollbar-hide">
        <HeroVideo />
        <VideoGrid />
      </div>
    </>
  );
}
