"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

export function PageTransition() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<"idle" | "in" | "out">("idle");
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (pathname === prevPathname.current) return;
    prevPathname.current = pathname;

    // Fade to black
    setPhase("in");
    // After fade-in completes, fade out
    const timer = setTimeout(() => {
      setPhase("out");
      // After fade-out completes, idle
      const hide = setTimeout(() => setPhase("idle"), 500);
      return () => clearTimeout(hide);
    }, 500);

    return () => clearTimeout(timer);
  }, [pathname]);

  if (phase === "idle") return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-[#0a0a0a] pointer-events-none transition-opacity duration-500 ${
        phase === "in" ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}
