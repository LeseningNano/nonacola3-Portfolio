"use client";

import { useEffect, useRef } from "react";
import { HeroVideo } from "@/components/hero-video";
import { ShowreelVideo } from "@/components/showreel-section";
import { VideoGrid } from "@/components/video-grid";
import { ContactSection } from "@/components/contact-section";
import { SectionNav } from "@/components/section-nav";

const sectionIds = ["hero", "works", "showreel", "contact"];

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
      isScrolling.current = true;
      container!.scrollTo({
        top: clamped * container!.clientHeight,
        behavior: "smooth",
      });
      setTimeout(() => {
        isScrolling.current = false;
      }, 600);
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
        <VideoGrid />
        <ShowreelVideo />
        <ContactSection />
      </div>
    </>
  );
}
