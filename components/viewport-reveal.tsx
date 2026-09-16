"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties, ElementType, ReactNode } from "react";

export type RevealVariant = "heading" | "content" | "dim";

export function shouldSkipRevealMotion(reducedMotion: boolean): boolean {
  return reducedMotion;
}

type RevealTag = "div" | "h2" | "p" | "section";

// 一次性视口入场：只在元素首次进入视口时翻到可见态，随后解除观察，
// 同一次页面访问不会重复播放。具体运动全部交给 globals.css 的
// [data-reveal-*] 规则；本组件只负责"何时进入"。
// 隐藏态（data-reveal-pending）只由下方 effect 在浏览器中添加，
// SSR 输出与禁用 JS 时内容始终可见。
export function Reveal({
  as = "div",
  variant,
  delay,
  className,
  children,
}: {
  as?: RevealTag;
  variant: RevealVariant;
  delay?: number;
  className?: string;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (shouldSkipRevealMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches)) {
      el.setAttribute("data-reveal-visible", "");
      return;
    }

    let observer: IntersectionObserver | null = null;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      // 双 rAF 确保浏览器先提交隐藏态那一帧，再开始观察，过渡才会播放
      raf2 = requestAnimationFrame(() => {
        el.setAttribute("data-reveal-pending", "");
        observer = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (!entry.isIntersecting) continue;
              el.removeAttribute("data-reveal-pending");
              el.setAttribute("data-reveal-visible", "");
              observer?.disconnect();
              observer = null;
            }
          },
          { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
        );
        observer.observe(el);
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      observer?.disconnect();
    };
  }, []);

  const Tag = as as ElementType;
  const style =
    delay === undefined
      ? undefined
      : ({ "--reveal-delay": `${delay}ms` } as CSSProperties);

  if (variant === "heading") {
    return (
      <Tag
        ref={ref}
        data-reveal="heading"
        className={className}
        style={style}
      >
        <span className="reveal-inner">{children}</span>
      </Tag>
    );
  }

  return (
    <Tag ref={ref} data-reveal={variant} className={className} style={style}>
      {children}
    </Tag>
  );
}
