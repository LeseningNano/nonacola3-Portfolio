"use client";

import { useEffect, useRef } from "react";
import { HeroVideo } from "@/components/hero-video";
import { ShowreelVideo } from "@/components/showreel-section";
import { VideoGrid } from "@/components/video-grid";
import { ContactSection } from "@/components/contact-section";
import { SectionNav } from "@/components/section-nav";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetScroll = useRef(0);
  const animating = useRef(false);
  const startTime = useRef(0);
  const startScroll = useRef(0);
  const distance = useRef(0);
  const duration = 900;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    targetScroll.current = container.scrollTop;

    function easeOutCubic(t: number) {
      return 1 - Math.pow(1 - t, 3);
    }

    function animate(timestamp: number) {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      container!.scrollTop = startScroll.current + distance.current * eased;
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        animating.current = false;
      }
    }

    function handleWheel(e: WheelEvent) {
      e.preventDefault();

      const maxScroll = container!.scrollHeight - container!.clientHeight;
      targetScroll.current = Math.max(
        0,
        Math.min(maxScroll, targetScroll.current + e.deltaY * 2.5)
      );

      if (!animating.current) {
        animating.current = true;
        startTime.current = 0;
        startScroll.current = container!.scrollTop;
        distance.current = targetScroll.current - startScroll.current;
        requestAnimationFrame(animate);
      } else {
        distance.current = targetScroll.current - container!.scrollTop;
      }
    }

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  return (
    <>
      <SectionNav />
      <div ref={containerRef} className="h-screen overflow-y-hidden scrollbar-hide">
        <HeroVideo />
        <VideoGrid />
        <ShowreelVideo />
        <ContactSection />
      </div>
    </>
  );
}
