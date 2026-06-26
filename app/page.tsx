"use client";

import { useEffect, useRef, useState } from "react";
import { HeroVideo } from "@/components/hero-video";
import { VideoGrid } from "@/components/video-grid";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetScroll = useRef(0);
  const currentScroll = useRef(0);
  const rafId = useRef(0);
  const lastTime = useRef(0);
  const isAnimating = useRef(false);
  const scrollEasing = useRef(10);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);

    function onResize(e: MediaQueryListEvent) {
      setIsMobile(e.matches);
    }
    mq.addEventListener("change", onResize);
    return () => mq.removeEventListener("change", onResize);
  }, []);

  useEffect(() => {
    if (isMobile) return;

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

    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      scrollEasing.current = 10;

      const maxScroll = container!.scrollHeight - container!.clientHeight;
      targetScroll.current = Math.max(
        0,
        Math.min(maxScroll, targetScroll.current + e.deltaY * 1.5)
      );

      if (!rafId.current) {
        currentScroll.current = container!.scrollTop;
        lastTime.current = performance.now();
        rafId.current = requestAnimationFrame(animate);
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
      const maxScroll = container!.scrollHeight - container!.clientHeight;
      targetScroll.current = Math.max(0, Math.min(maxScroll, detail.target));
      scrollEasing.current = 8;
      if (!rafId.current) {
        currentScroll.current = container!.scrollTop;
        lastTime.current = performance.now();
        rafId.current = requestAnimationFrame(animate);
      }
    }

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("scroll", handleScroll, { passive: true });
    container.addEventListener("smooth-scroll-to", handleSmoothScroll);
    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("scroll", handleScroll);
      container.removeEventListener("smooth-scroll-to", handleSmoothScroll);
      cancelAnimationFrame(rafId.current);
    };
  }, [isMobile]);

  if (isMobile) {
    return (
      <>
        <HeroVideo />
        <VideoGrid />
      </>
    );
  }

  return (
    <>
      <div ref={containerRef} className="h-screen overflow-y-auto scrollbar-hide">
        <HeroVideo />
        <VideoGrid />
      </div>
    </>
  );
}
