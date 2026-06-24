"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const scrollContainer = document.querySelector("div.h-screen");
    if (!scrollContainer) return;

    const handleScroll = () => {
      setIsScrolled(scrollContainer.scrollTop > 50);
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
      <div className="px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg">
          {siteConfig.name}
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/reel"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            REEL
          </Link>
          <Link
            href="/about"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            关于
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            管理
          </Link>
        </div>
      </div>

      {/* Animated Bottom Border */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-[1px]",
          !isScrolled
            ? "bg-transparent transition-colors duration-300"
            : "animate-border-flash"
        )}
      />
    </nav>
  );
}
