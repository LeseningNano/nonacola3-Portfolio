"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const sections = [
  { id: "hero", label: "返回主屏" },
  { id: "works", label: "作品" },
  { id: "showreel", label: "REEL" },
  { id: "contact", label: "关于" },
];

export function SectionNav() {
  const [active, setActive] = useState("hero");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const loader = document.querySelector("[data-hero-loader]");
    if (!loader) {
      setVisible(true);
    } else {
      // Show nav when loader starts fading (opacity transition begins)
      const observer = new MutationObserver(() => {
        const el = document.querySelector("[data-hero-loader]") as HTMLElement | null;
        if (!el || el.style.opacity === "0" || el.classList.contains("opacity-0")) {
          setVisible(true);
          observer.disconnect();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"] });
      // Fallback: show after 3s regardless
      const fallback = setTimeout(() => { setVisible(true); observer.disconnect(); }, 3000);
      return () => { observer.disconnect(); clearTimeout(fallback); };
    }
  }, []);

  useEffect(() => {
    const container = document.querySelector("main") || document.querySelector("div.h-screen");
    if (!container) return;

    const observers: IntersectionObserver[] = [];

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActive(id);
          }
        },
        { root: container, threshold: 0.5 }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    const container = document.querySelector("div.h-screen");
    if (!el || !container) return;

    const start = container.scrollTop;
    const target = el.offsetTop;
    const distance = target - start;
    const duration = 1200;
    let startTime: number | null = null;

    function easeInOutCubic(t: number) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function step(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOutCubic(progress);
      container!.scrollTop = start + distance * eased;
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  return (
    <>
      {/* Right-side gradient overlay */}
      <div className={cn(
        "fixed top-0 right-0 bottom-0 w-48 md:w-64 lg:w-80 z-40 pointer-events-none bg-gradient-to-l from-black/30 via-black/10 to-transparent transition-all duration-400 ease-out",
        visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
      )} />
      <nav className={cn(
        "fixed right-6 md:right-10 lg:right-14 top-1/2 -translate-y-1/2 z-50 transition-all duration-400 ease-out",
        visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
      )}>
        {/* Single line from first to last dot */}
        <div className="absolute right-[7.5px] top-[5px] bottom-[5px] w-px bg-zinc-600/50" />
        <div className="flex flex-col items-end gap-6 md:gap-7">
        {sections.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => scrollTo(id)}
            className="group relative flex items-center gap-4"
          >
            <span
              className={cn(
                "text-xs md:text-sm tracking-wider uppercase transition-all duration-300 w-24 text-right",
                id === "hero" && active === "hero"
                  ? "opacity-0"
                  : active === id
                    ? "text-white opacity-100 translate-x-0"
                    : "opacity-60 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 text-zinc-300"
              )}
            >
              {label}
            </span>
            <span className="relative flex items-center justify-center w-4">
              <span
                className={cn(
                  "block w-1.5 h-1.5 rounded-full transition-all duration-300 relative z-10",
                  active === id
                    ? "bg-white shadow-[0_0_6px_rgba(255,255,255,0.6)]"
                    : "bg-zinc-500 group-hover:bg-zinc-300"
                )}
              />
            </span>
          </button>
        ))}
        </div>
      </nav>
    </>
  );
}
