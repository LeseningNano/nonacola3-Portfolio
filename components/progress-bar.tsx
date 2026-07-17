"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

export function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const [opacity, setOpacity] = useState(0);
  const [visible, setVisible] = useState(false);
  const pendingUrl = useRef<string | null>(null);
  const isTransitioning = useRef(false);
  const prevPathname = useRef(pathname);

  // Detect route change complete → fade out
  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      if (isTransitioning.current) {
        // Fade out after small delay to ensure new page rendered
        setTimeout(() => {
          setOpacity(0);
          setTimeout(() => {
            setVisible(false);
            isTransitioning.current = false;
          }, 200);
        }, 50);
      }
    }
  }, [pathname]);

  const startTransition = useCallback((url: string) => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;
    pendingUrl.current = url;

    // Fade to black
    setVisible(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setOpacity(1));
    });

    // After fade-in, navigate via Next.js router (no full reload)
    setTimeout(() => {
      router.push(url);
    }, 200);
  }, [router]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (isTransitioning.current) {
        e.preventDefault();
        return;
      }

      // Let browser handle new-tab / download / modified clicks natively
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      if (href.startsWith("/") && !href.startsWith("//")) {
        if (href.startsWith("/dashboard") || href.startsWith("/login")) return;
        // Don't intercept if already on this page
        if (href === pathname) return;

        e.preventDefault();
        e.stopPropagation();
        startTransition(href);
      }
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [startTransition, pathname]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-[#0a0a0a] pointer-events-none"
      style={{ opacity, transition: "opacity 200ms ease-in-out" }}
    />
  );
}
