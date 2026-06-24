"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

export function ProgressBar() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [progress, setProgress] = useState(0);
  const prevPathname = useRef(pathname);
  const timers = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    if (pathname === prevPathname.current) return;
    prevPathname.current = pathname;

    // Clear any pending timers
    timers.current.forEach(clearTimeout);
    timers.current = [];

    // Show loader
    setShow(true);
    setFadeOut(false);
    setProgress(0);

    // Animate progress
    timers.current.push(setTimeout(() => setProgress(30), 100));
    timers.current.push(setTimeout(() => setProgress(55), 300));
    timers.current.push(setTimeout(() => setProgress(75), 600));
    timers.current.push(setTimeout(() => setProgress(90), 900));
    timers.current.push(setTimeout(() => setProgress(100), 1100));

    // Fade out then hide
    timers.current.push(
      setTimeout(() => {
        setFadeOut(true);
        timers.current.push(
          setTimeout(() => {
            setShow(false);
            setProgress(0);
          }, 500)
        );
      }, 1300)
    );

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [pathname]);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0a0a] transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="w-screen h-[2px] bg-zinc-800 overflow-hidden">
        <div
          className="h-full bg-white origin-center"
          style={{
            transform: `scaleX(${progress / 100})`,
            transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>
    </div>
  );
}
