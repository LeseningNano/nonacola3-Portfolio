"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const sections = [
  { id: "hero", label: "Hero" },
  { id: "showreel", label: "Showreel" },
  { id: "works", label: "作品集" },
  { id: "contact", label: "关于我" },
];

export function SectionNav() {
  const [active, setActive] = useState("hero");

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
    const sections_arr = ["hero", "showreel", "works", "contact"];
    const index = sections_arr.indexOf(id);
    const container = document.querySelector("div.h-screen");
    if (container && index >= 0) {
      container.scrollTo({
        top: index * container.clientHeight,
        behavior: "smooth",
      });
    }
  }

  return (
    <>
      {/* Right-side gradient overlay */}
      <div className="fixed top-0 right-0 bottom-0 w-48 md:w-64 lg:w-80 z-40 pointer-events-none bg-gradient-to-l from-black/30 via-black/10 to-transparent" />
      <nav className="fixed right-6 md:right-10 lg:right-14 top-1/2 -translate-y-1/2 z-50 flex flex-col items-end gap-6 md:gap-7">
        {sections.map(({ id, label }, i) => (
          <button
            key={id}
            onClick={() => scrollTo(id)}
            className="group relative flex items-center gap-4"
          >
            <span
              className={cn(
                "text-xs md:text-sm tracking-wider uppercase",
                id === "hero"
                  ? active === "hero"
                    ? "opacity-0 w-0 overflow-hidden"
                    : "opacity-60 group-hover:opacity-100 text-zinc-300 transition-all duration-300"
                  : active === id
                    ? "text-white opacity-100 translate-x-0 transition-all duration-300"
                    : "opacity-60 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 text-zinc-300 transition-all duration-300"
              )}
            >
              {id === "hero" && active !== "hero" ? "返回顶部" : label}
            </span>
            <span className="relative flex items-center justify-center w-4">
              {/* Line segment above dot */}
              {i > 0 && (
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 w-px h-6 md:h-7 bg-zinc-600/50" />
              )}
              {/* Line segment below dot */}
              {i < sections.length - 1 && (
                <span className="absolute top-full left-1/2 -translate-x-1/2 w-px h-6 md:h-7 bg-zinc-600/50" />
              )}
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
      </nav>
    </>
  );
}
