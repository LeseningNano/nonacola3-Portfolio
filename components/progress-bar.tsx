"use client";

import { useEffect, useState, useCallback } from "react";

export function PageTransition() {
  const [mounted, setMounted] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // New page: fade out from black
    if (sessionStorage.getItem("page-transition") === "out") {
      sessionStorage.removeItem("page-transition");
      setVisible(true);
      setOpacity(1);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setOpacity(0);
        });
      });
      const timer = setTimeout(() => setVisible(false), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const startTransition = useCallback((url: string) => {
    setVisible(true);
    setOpacity(0);
    // Fade in to black
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setOpacity(1);
      });
    });
    // Navigate after fade-in
    setTimeout(() => {
      sessionStorage.setItem("page-transition", "out");
      window.location.href = url;
    }, 500);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      if (href.startsWith("/") && !href.startsWith("//")) {
        if (href.startsWith("/dashboard") || href.startsWith("/login")) return;

        e.preventDefault();
        startTransition(href);
      }
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [startTransition]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-[#0a0a0a] pointer-events-none"
      style={{ opacity, transition: "opacity 500ms ease-in-out" }}
    />
  );
}
