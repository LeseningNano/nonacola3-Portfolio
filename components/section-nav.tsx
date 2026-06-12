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
    <nav className="fixed right-8 md:right-12 lg:right-16 top-1/2 -translate-y-1/2 z-50 flex flex-col items-end gap-5 md:gap-6">
      {sections.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => scrollTo(id)}
          className="group flex items-center gap-4"
        >
          <span
            className={cn(
              "text-xs md:text-sm tracking-wider uppercase transition-all duration-300 opacity-50 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0",
              active === id ? "text-white opacity-100 translate-x-0" : "text-zinc-400"
            )}
          >
            {label}
          </span>
          <span
            className={cn(
              "block rounded-full transition-all duration-300",
              active === id
                ? "w-2.5 h-2.5 md:w-3 md:h-3 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                : "w-1.5 h-1.5 md:w-2 md:h-2 bg-zinc-500 group-hover:bg-zinc-300"
            )}
          />
        </button>
      ))}
    </nav>
  );
}
