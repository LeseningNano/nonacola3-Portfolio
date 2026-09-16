"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

// 桌面端 Works 媒体的极轻纵向漂移（总幅度 ≤14px）。
// transform 只作用于本包装元素，绝不触碰 Marquee 自身的横向 translateX。
export const DRIFT_AMPLITUDE_PX = 7;

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

// progress 0 = 元素刚从视口底部进入，1 = 即将从视口顶部离开
export function driftOffset(
  progress: number,
  amplitude: number = DRIFT_AMPLITUDE_PX
): number {
  return (0.5 - clamp01(progress)) * 2 * amplitude;
}

export function shouldRunDrift(desktop: boolean, reducedMotion: boolean): boolean {
  return desktop && !reducedMotion;
}

export function WorksDrift({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const desktop = window.matchMedia("(min-width: 769px)");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!shouldRunDrift(desktop.matches, reduceMotion.matches)) return;

    let inView = false;
    let rafId = 0;

    function apply() {
      rafId = 0;
      if (!el || !inView) return;
      const rect = el.getBoundingClientRect();
      const viewport = window.innerHeight;
      const progress = clamp01((viewport - rect.top) / (viewport + rect.height));
      el.style.transform = `translateY(${driftOffset(progress).toFixed(2)}px)`;
    }

    function schedule() {
      if (!rafId && inView) rafId = requestAnimationFrame(apply);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        inView = entries.some((entry) => entry.isIntersecting);
        if (inView) {
          schedule();
        } else if (el) {
          // 离开视口后复位，避免残留偏移
          el.style.transform = "";
        }
      },
      { rootMargin: "10% 0px 10% 0px" }
    );
    observer.observe(el);

    // document capture 兜住桌面 #main-scroll 与 window 两种滚动源
    document.addEventListener("scroll", schedule, { capture: true, passive: true });
    window.addEventListener("resize", schedule, { passive: true });

    return () => {
      observer.disconnect();
      document.removeEventListener("scroll", schedule, { capture: true });
      window.removeEventListener("resize", schedule);
      if (rafId) cancelAnimationFrame(rafId);
      if (el) el.style.transform = "";
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}
