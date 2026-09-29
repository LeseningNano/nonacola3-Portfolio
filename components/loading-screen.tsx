"use client";

import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/lib/config";
import {
  advanceLoaderClock,
  getLoaderState,
  getLoaderTimeline,
  type LoaderState,
} from "@/lib/loader-intro";

// 首访加载画面：中央百分比计数，到 100% 后乱码解码成名字，中线亮起，上下黑幕拉开露出 Hero。
// 时间线由 rAF 驱动（后台标签页暂停、回到前台继续）；回调存在 ref 里，
// 父组件重渲染换掉回调也不会打断时间线（旧实现会因此卡在 100%）。
export function LoadingScreen({
  onReveal,
  onDone,
}: {
  onReveal: () => void;
  onDone: () => void;
}) {
  const [state, setState] = useState<LoaderState>({ phase: "count", text: "000%", progress: 0 });
  const onRevealRef = useRef(onReveal);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onRevealRef.current = onReveal;
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    const { revealAt, doneAt } = getLoaderTimeline(siteConfig.name);
    let frame = 0;
    let last = 0;
    let elapsed = 0;
    let revealed = false;

    const tick = (now: number) => {
      elapsed = last ? advanceLoaderClock(elapsed, now - last) : 0;
      last = now;
      setState(getLoaderState(elapsed, siteConfig.name));
      if (!revealed && elapsed >= revealAt) {
        revealed = true;
        onRevealRef.current();
      }
      if (elapsed >= doneAt) {
        onDoneRef.current();
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div data-hero-loader data-loader-phase={state.phase} className="fixed inset-0 z-[9999]">
      <span className="sr-only">Loading {siteConfig.name}</span>
      <div aria-hidden="true" className="loader-panel-top absolute inset-x-0 top-0 h-1/2 bg-[#0a0a0a]" />
      <div aria-hidden="true" className="loader-panel-bottom absolute inset-x-0 bottom-0 h-1/2 bg-[#0a0a0a]" />
      <div aria-hidden="true" className="loader-seam absolute inset-x-0 top-1/2 h-px bg-white" />
      <div aria-hidden="true" className="loader-content absolute inset-0">
        <div className="flex h-full items-center justify-center">
          <span className="text-6xl leading-none sm:text-7xl md:text-8xl" style={{ fontFamily: "var(--font-bitcount)" }}>
            {state.text}
          </span>
        </div>
        <div className="absolute inset-x-6 bottom-8 flex items-center justify-between gap-6 text-[10px] tracking-[0.3em] text-neutral-500 md:inset-x-12 md:text-[11px]">
          <span>VIDEO PORTFOLIO</span>
          <span className="hidden h-px max-w-72 flex-1 bg-neutral-800 sm:block">
            <span
              className="block h-px origin-left bg-white"
              style={{ transform: `scaleX(${state.progress})` }}
            />
          </span>
          <span>VER 04 · © {new Date().getFullYear()}</span>
        </div>
      </div>
    </div>
  );
}
