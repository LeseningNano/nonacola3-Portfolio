"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

export const SCROLL_CONTAINER_ID = "main-scroll";

export function shouldUseNativeSmoothScroll(desktop: boolean, reducedMotion: boolean) {
  return !desktop || reducedMotion;
}

export function shouldIgnoreScrollKey(
  tagName: string,
  isContentEditable: boolean,
  defaultPrevented: boolean
) {
  return (
    defaultPrevented ||
    isContentEditable ||
    ["A", "BUTTON", "INPUT", "SELECT", "TEXTAREA"].includes(tagName)
  );
}

export function SmoothScrollContainer({
  children,
  className = "",
  lang,
}: {
  children: ReactNode;
  className?: string;
  lang?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetScroll = useRef(0);
  const currentScroll = useRef(0);
  const rafId = useRef(0);
  const lastTime = useRef(0);
  const isAnimating = useRef(false);
  const scrollEasing = useRef(10);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 769px)");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!desktop.matches || reduceMotion.matches) return;

    const container = containerRef.current;
    if (!container) return;

    currentScroll.current = container.scrollTop;
    targetScroll.current = container.scrollTop;

    function animate(now: number) {
      const dt = Math.min((now - lastTime.current) / 1000, 0.1);
      lastTime.current = now;

      const diff = targetScroll.current - currentScroll.current;
      if (Math.abs(diff) < 0.5) {
        currentScroll.current = targetScroll.current;
        container!.scrollTop = targetScroll.current;
        isAnimating.current = false;
        rafId.current = 0;
        return;
      }

      const factor = 1 - Math.exp(-scrollEasing.current * dt);
      currentScroll.current += diff * factor;
      isAnimating.current = true;
      container!.scrollTop = currentScroll.current;
      rafId.current = requestAnimationFrame(animate);
    }

    function startAnimation() {
      if (!rafId.current) {
        currentScroll.current = container!.scrollTop;
        lastTime.current = performance.now();
        rafId.current = requestAnimationFrame(animate);
      }
    }

    function clampTarget(value: number) {
      const maxScroll = container!.scrollHeight - container!.clientHeight;
      targetScroll.current = Math.max(0, Math.min(maxScroll, value));
    }

    function handleWheel(event: WheelEvent) {
      if ((event.target as HTMLElement).closest("[data-modal]")) return;
      event.preventDefault();
      scrollEasing.current = 10;
      clampTarget(targetScroll.current + event.deltaY * 1.5);
      startAnimation();
    }

    const keyScrolls: Record<string, number> = {
      ArrowDown: 120,
      ArrowUp: -120,
      PageDown: container.clientHeight * 0.9,
      PageUp: -container.clientHeight * 0.9,
      " ": container.clientHeight * 0.9,
    };

    function handleKeydown(event: KeyboardEvent) {
      const target = event.target;
      const tagName = target instanceof HTMLElement ? target.tagName : "";
      const isContentEditable = target instanceof HTMLElement && target.isContentEditable;
      if (shouldIgnoreScrollKey(tagName, isContentEditable, event.defaultPrevented)) return;

      if (event.key === "Home") {
        event.preventDefault();
        scrollEasing.current = 8;
        clampTarget(0);
        startAnimation();
        return;
      }
      if (event.key === "End") {
        event.preventDefault();
        scrollEasing.current = 8;
        clampTarget(container!.scrollHeight);
        startAnimation();
        return;
      }
      const delta = keyScrolls[event.key];
      if (delta !== undefined) {
        event.preventDefault();
        scrollEasing.current = 10;
        clampTarget(targetScroll.current + delta);
        startAnimation();
      }
    }

    function handleScroll() {
      if (isAnimating.current) return;
      currentScroll.current = container!.scrollTop;
      targetScroll.current = container!.scrollTop;
    }

    function handleSmoothScroll(event: Event) {
      const detail = (event as CustomEvent<{ target: number; easing?: number }>).detail;
      if (typeof detail?.target !== "number") return;
      scrollEasing.current = detail.easing ?? 8;
      clampTarget(detail.target);
      startAnimation();
    }

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("scroll", handleScroll, { passive: true });
    container.addEventListener("smooth-scroll-to", handleSmoothScroll);
    window.addEventListener("keydown", handleKeydown);
    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("scroll", handleScroll);
      container.removeEventListener("smooth-scroll-to", handleSmoothScroll);
      window.removeEventListener("keydown", handleKeydown);
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const desktop = window.matchMedia("(min-width: 769px)");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function handleSmoothScroll(event: Event) {
      const detail = (event as CustomEvent<{ target: number }>).detail;
      if (
        typeof detail?.target !== "number" ||
        !shouldUseNativeSmoothScroll(desktop.matches, reduceMotion.matches)
      ) {
        return;
      }

      if (desktop.matches) {
        const max = container!.scrollHeight - container!.clientHeight;
        container!.scrollTo({
          top: Math.max(0, Math.min(max, detail.target)),
          behavior: "auto",
        });
        return;
      }

      const max = document.body.scrollHeight - window.innerHeight;
      window.scrollTo({ top: Math.max(0, Math.min(max, detail.target)), behavior: "smooth" });
    }

    container.addEventListener("smooth-scroll-to", handleSmoothScroll);
    return () => container.removeEventListener("smooth-scroll-to", handleSmoothScroll);
  }, []);

  return (
    <div
      ref={containerRef}
      id={SCROLL_CONTAINER_ID}
      lang={lang}
      data-smooth-scroll="true"
      className={`md:h-screen md:overflow-y-auto scrollbar-hide ${className}`.trim()}
    >
      {children}
    </div>
  );
}
