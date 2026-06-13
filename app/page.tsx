"use client";

import { useEffect, useRef } from "react";
import { HeroVideo } from "@/components/hero-video";
import { ShowreelVideo } from "@/components/showreel-section";
import { VideoGrid } from "@/components/video-grid";
import { ContactSection } from "@/components/contact-section";
import { SectionNav } from "@/components/section-nav";

const sectionIds = ["hero", "showreel", "works", "contact"];

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function getCurrentSection() {
      const scrollTop = container!.scrollTop;
      const height = container!.clientHeight;
      return Math.round(scrollTop / height);
    }

    function scrollToSection(index: number) {
      const clamped = Math.max(0, Math.min(index, sectionIds.length - 1));
      if (clamped === getCurrentSection()) return;
      isScrolling.current = true;

      const start = container!.scrollTop;
      const target = clamped * container!.clientHeight;
      const distance = target - start;
      const duration = 700;
      const startTime = performance.now();

      function easeOutCubic(t: number) {
        return 1 - Math.pow(1 - t, 3);
      }

      function animate(now: number) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        container!.scrollTop = start + distance * easeOutCubic(progress);
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          isScrolling.current = false;
        }
      }

      requestAnimationFrame(animate);
    }

    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      if (isScrolling.current) return;

      const current = getCurrentSection();
      if (e.deltaY > 0) {
        scrollToSection(current + 1);
      } else if (e.deltaY < 0) {
        scrollToSection(current - 1);
      }
    }

    document.addEventListener("wheel", handleWheel, { passive: false });
    return () => document.removeEventListener("wheel", handleWheel);
  }, []);

  return (
    <>
      <SectionNav />
      <div ref={containerRef} className="h-screen overflow-y-scroll scrollbar-hide">
        <HeroVideo />
        <ShowreelVideo />
        <VideoGrid />
        <ContactSection />
      </div>
    </>
  );
}
