"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Reveal } from "@/components/viewport-reveal";
import { formatReelCounter, getReelIndex } from "@/lib/works-index";
import { SelectedWorkCard } from "./selected-work-card";
import { useWorksLanguage } from "./works-language-provider";
import type { VideoRow } from "@/lib/types";

// /works 精选：横向胶片。一次聚焦一个作品，下一个从右侧露出一截。
// 手机用原生横向滑动（scroll-snap）；桌面用左右按钮，触控板横向手势由
// SmoothScrollContainer 按 data-horizontal-scroll 放行；Tab 到屏外卡片时浏览器会自动滚入。
// 只有 1 个作品时不显示计数、按钮与进度条。
export function SelectedWorksReel({ works, header }: { works: VideoRow[]; header: ReactNode }) {
  const { copy } = useWorksLanguage();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const count = works.length;
  const single = count <= 1;
  const counter = formatReelCounter(index, count);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || single) return;
    const el = scroller;

    function handleScroll() {
      const items = el.querySelectorAll<HTMLElement>("[data-reel-item]");
      const step = items.length > 1 ? items[1].offsetLeft - items[0].offsetLeft : el.clientWidth;
      setIndex(getReelIndex(el.scrollLeft, step, count));
    }

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [count, single]);

  function goTo(target: number) {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const item = scroller.querySelectorAll<HTMLElement>("[data-reel-item]")[
      Math.min(count - 1, Math.max(0, target))
    ];
    if (!item) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scroller.scrollTo({ left: item.offsetLeft, behavior: reduce ? "auto" : "smooth" });
  }

  const arrowClass =
    "flex h-11 w-11 items-center justify-center rounded-full border border-white/40 text-white transition-colors duration-300 hover:border-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-default disabled:opacity-30 disabled:hover:border-white/40 disabled:hover:bg-transparent motion-reduce:transition-none";

  return (
    <div>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>{header}</div>
        {!single && (
          <div className="flex shrink-0 items-center gap-3">
            <p aria-live="polite" className="mr-2 whitespace-nowrap text-lg tabular-nums" style={{ fontFamily: "var(--font-bitcount)" }}>
              {counter.current}
              <span className="text-neutral-600"> / {counter.total}</span>
            </p>
            <button
              type="button"
              aria-label={copy.selected.previousLabel}
              disabled={index === 0}
              onClick={() => goTo(index - 1)}
              className={arrowClass}
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label={copy.selected.nextLabel}
              disabled={index === count - 1}
              onClick={() => goTo(index + 1)}
              className={arrowClass}
            >
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <Reveal variant="content" delay={200} className="mt-10">
        <div
          ref={scrollerRef}
          data-horizontal-scroll=""
          className={
            single
              ? undefined
              : "scrollbar-hide relative flex snap-x snap-mandatory gap-6 overflow-x-auto"
          }
        >
          {works.map((work, i) => (
            <div
              key={work.id}
              data-reel-item=""
              className={
                single
                  ? undefined
                  : `w-[85%] shrink-0 snap-start transition-opacity duration-500 motion-reduce:transition-none md:w-[78%] ${
                      i === index ? "opacity-100" : "opacity-35 md:hover:opacity-70"
                    }`
              }
            >
              <SelectedWorkCard work={work} index={String(i + 1).padStart(2, "0")} />
            </div>
          ))}
          {/* 末尾留白：让最后一个作品也能停到最左边 */}
          {!single && <div aria-hidden="true" className="w-[calc(15%-1.5rem)] shrink-0 md:w-[calc(22%-1.5rem)]" />}
        </div>

        {!single && (
          <div className="mt-4 flex gap-2">
            {works.map((work, i) => (
              <button
                key={work.id}
                type="button"
                data-reel-segment=""
                aria-label={copy.selected.jumpLabel(i + 1, work.title)}
                aria-current={i === index ? "true" : undefined}
                onClick={() => goTo(i)}
                className="group flex-1 cursor-pointer py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                {/* 线仍是 2px，上下 py-4 扩大点击区域 */}
                <span
                  className={`block h-0.5 transition-colors duration-500 motion-reduce:transition-none ${
                    i === index ? "bg-white" : "bg-neutral-800 group-hover:bg-neutral-500"
                  }`}
                />
              </button>
            ))}
          </div>
        )}
      </Reveal>
    </div>
  );
}
