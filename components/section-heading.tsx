"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  getScrambleDurationMs,
  getScrambleFrame,
  getSubtitleDelayMs,
} from "@/lib/scramble-text";

type HeadingPhase = "static" | "pending" | "play";

// 两页共用的章节标题：Bitcount 小写标题 + 浅灰副标题。
// 进入视口时标题逐字「解码」、副标题从左擦出，只播一次。
// SSR 与无 JS 时输出完整文字；隐藏态只在浏览器中、且未开启减少动态效果时添加。
export function SectionHeading({
  title,
  subtitle,
  id,
  className,
  subtitleRef,
}: {
  title: string;
  subtitle?: string;
  id?: string;
  className?: string;
  subtitleRef?: (el: HTMLElement | null) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<HeadingPhase>("static");
  const [display, setDisplay] = useState(title);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let observer: IntersectionObserver | null = null;
    const total = getScrambleDurationMs(title);

    function play() {
      setPhase("play");
      const start = performance.now();
      const tick = (now: number) => {
        const elapsed = now - start;
        if (elapsed >= total) {
          setDisplay(title);
          frame = 0;
          return;
        }
        setDisplay(getScrambleFrame(title, elapsed));
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }

    // 与 Reveal 一致：先提交隐藏态这一帧，再开始观察，副标题过渡才会播放
    frame = requestAnimationFrame(() => {
      setPhase("pending");
      setDisplay("");
      frame = requestAnimationFrame(() => {
        observer = new IntersectionObserver(
          (entries) => {
            if (!entries.some((entry) => entry.isIntersecting)) return;
            observer?.disconnect();
            observer = null;
            play();
          },
          { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
        );
        observer.observe(el);
      });
    });

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [title]);

  return (
    <div ref={rootRef} data-section-heading={phase} className={className}>
      <h2
        id={id}
        aria-label={title}
        className="text-4xl font-normal tracking-tight md:text-5xl lg:text-6xl"
        style={{ fontFamily: "var(--font-bitcount)" }}
      >
        {/* 占位空格保持行高，避免隐藏态时标题塌陷造成跳动 */}
        <span aria-hidden="true">{display || " "}</span>
      </h2>
      {subtitle && (
        <p
          ref={subtitleRef}
          className="section-heading-sub mt-1 text-base text-neutral-400 md:text-lg"
          style={{ "--sub-delay": `${getSubtitleDelayMs(title)}ms` } as CSSProperties}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
