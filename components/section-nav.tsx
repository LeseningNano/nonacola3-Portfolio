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
      {sections.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => scrollTo(id)}
          className="group flex items-center gap-4"
        >
          <span
            className={cn(
              "text-xs md:text-sm tracking-wider uppercase transition-all duration-300 opacity-60 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0",
              active === id ? "text-white opacity-100 translate-x-0" : "text-zinc-300"
            )}
          >
            {label}
          </span>
          <span
            className={cn(
              "block rounded-full transition-all duration-300",
              active === id
                ? "w-3 h-3 md:w-3.5 md:h-3.5 bg-white shadow-[0_0_12px_rgba(255,255,255,0.6)]"
                : "w-2 h-2 md:w-2.5 md:h-2.5 bg-zinc-400 group-hover:bg-white"
            )}
          />
        </button>
      ))}
    </nav>
    </>
  );
}
