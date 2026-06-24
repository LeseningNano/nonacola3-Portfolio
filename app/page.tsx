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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    targetScroll.current = container.scrollTop;

    function easeOutExpo(t: number) {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    function animate() {
      const cur = container!.scrollTop;
      const diff = targetScroll.current - cur;
      if (Math.abs(diff) < 0.5) {
        container!.scrollTop = targetScroll.current;
        animating.current = false;
        return;
      }
      container!.scrollTop = cur + diff * 0.12;
      requestAnimationFrame(animate);
    }

    function handleWheel(e: WheelEvent) {
      e.preventDefault();

      const maxScroll = container!.scrollHeight - container!.clientHeight;
      targetScroll.current = Math.max(
        0,
        Math.min(maxScroll, targetScroll.current + e.deltaY)
      );

      if (!animating.current) {
        animating.current = true;
        requestAnimationFrame(animate);
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
