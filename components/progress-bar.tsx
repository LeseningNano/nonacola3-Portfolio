"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

export function ProgressBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const animRef = useRef<number>(0);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (pathname === prevPathname.current) return;
    prevPathname.current = pathname;

    // Route changed — show bar and animate
    setVisible(true);
    setProgress(0);

    let current = 0;
    const steps = [
      { target: 30, delay: 100 },
      { target: 60, delay: 300 },
      { target: 80, delay: 600 },
      { target: 95, delay: 1000 },
    ];

    const timers: NodeJS.Timeout[] = [];
    steps.forEach(({ target, delay }) => {
      timers.push(
        setTimeout(() => {
          setProgress(target);
        }, delay)
      );
    });

    // Complete after a short delay
    timers.push(
      setTimeout(() => {
        setProgress(100);
        setTimeout(() => {
          setVisible(false);
          setProgress(0);
        }, 300);
      }, 1200)
    );

    return () => {
      timers.forEach(clearTimeout);
      cancelAnimationFrame(animRef.current);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[2px]">
      <div
        className="h-full bg-white transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
