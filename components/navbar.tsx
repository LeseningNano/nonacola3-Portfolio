"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [flashKey, setFlashKey] = useState(0);
  const prevSection = useRef(0);

  useEffect(() => {
    const scrollContainer = document.querySelector("div.h-screen");
    if (!scrollContainer) return;

    const handleScroll = () => {
      const scrolled = scrollContainer.scrollTop > 50;
      setIsScrolled(scrolled);

      const sectionIndex = Math.round(scrollContainer.scrollTop / scrollContainer.clientHeight);
      if (sectionIndex !== prevSection.current) {
        prevSection.current = sectionIndex;
        setFlashKey((k) => k + 1);
      }
    };

    handleScroll();
    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-colors duration-300",
        isScrolled
          ? "bg-[#0a0a0a]/80 backdrop-blur-md"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg">
          {siteConfig.name}
        </Link>
        <div className="flex items-center gap-6">
          <button
            onClick={() => {
              const container = document.querySelector("div.h-screen");
              container?.scrollTo({ top: 3 * container.clientHeight, behavior: "smooth" });
            }}
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            联系
          </button>
          <Link
            href="/dashboard"
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            管理
          </Link>
        </div>
      </div>

      {/* Animated Bottom Border — key forces re-mount to restart CSS animation */}
      <div
        key={flashKey}
        className={cn(
          "absolute bottom-0 left-0 right-0 h-[1px]",
          flashKey === 0
            ? "bg-transparent"
            : "animate-border-flash"
        )}
      />
    </nav>
  );
}
