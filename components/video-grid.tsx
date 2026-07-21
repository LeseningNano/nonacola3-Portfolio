"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { VideoCard } from "./video-card";
import { WorksMarquee } from "./works-marquee";
import { ShowreelModal } from "./showreel-modal";
import { CategoryFilter } from "./category-filter";

interface Video {
  id: string;
  title: string;
  description: string | null;
  summary: string | null;
  category: string;
  embedUrl: string;
  thumbnail: string | null;
  featured: boolean;
  order: number;
  date: string | null;
}

export function VideoGrid({ videos }: { videos: Video[] }) {
  const [selectedYear, setSelectedYear] = useState("全部");
  const [showShowreel, setShowShowreel] = useState(false);
  const [view, setView] = useState<"marquee" | "grid">("marquee");
  const [animPhase, setAnimPhase] = useState<"exit" | "enter" | null>(null);
  const [wrapHeight, setWrapHeight] = useState<string>("auto");
  const contentRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  const years = useMemo(() => {
    const set = new Set<string>();
    for (const v of videos) {
      if (v.date) set.add(new Date(v.date).getFullYear().toString());
    }
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [videos]);

  const filteredVideos =
    selectedYear === "全部"
      ? videos
      : videos.filter((v) => v.date && new Date(v.date).getFullYear().toString() === selectedYear);

  // 编舞：当前内容向下加速沉出+淡出 → 锁定高度 → 换内容 → 高度推撑下方区域 + 新内容向下减速落入+淡入
  function toggleView() {
    if (animPhase) return; // 动画期间锁定
    const current = contentRef.current;
    if (current) setWrapHeight(`${current.offsetHeight}px`);
    setAnimPhase("exit");

    timers.current.push(
      window.setTimeout(() => {
        setView((v) => (v === "marquee" ? "grid" : "marquee"));
        setAnimPhase("enter");
        // 等新内容渲染后测量高度，推撑下方区域
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const el = contentRef.current;
            if (el) setWrapHeight(`${el.scrollHeight}px`);
          });
        });
        timers.current.push(
          window.setTimeout(() => {
            setWrapHeight("auto");
            setAnimPhase(null);
          }, 750)
        );
      }, 400)
    );
  }

  return (
    <section id="works" className="w-full bg-[#0a0a0a]">
      <div className="pt-16">
        <div className="mb-8 px-6 md:px-12 lg:px-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight" style={{ fontFamily: "var(--font-bitcount)" }}>works.</h2>
          <p className="text-base md:text-lg text-neutral-400 font-light mt-1">精选视频作品与创作项目</p>
        </div>

        {/* Showreel strip */}
        <div className="mb-10">
          <button
            onClick={() => setShowShowreel(true)}
            className="w-full h-12 bg-neutral-900 hover:bg-neutral-800 transition-colors duration-300 cursor-pointer group flex items-center justify-between px-6 md:px-12 lg:px-16"
          >
            <div className="flex items-center gap-3">
              <span className="text-neutral-500 text-sm md:text-base tracking-wider translate-y-px" style={{ fontFamily: "var(--font-bitcount)" }}>REEL</span>
              <span className="text-sm md:text-base text-neutral-400 group-hover:text-white transition-colors duration-300">视觉创作总结</span>
            </div>
            <span className="text-neutral-600 group-hover:text-neutral-400 text-xs transition-colors duration-300">▶</span>
          </button>
        </div>

        <div
          style={{
            height: wrapHeight,
            transition: wrapHeight === "auto" ? undefined : "height 500ms cubic-bezier(0.4, 0, 0.2, 1)",
            overflow: "hidden",
          }}
        >
          <div
            ref={contentRef}
            className={
              animPhase === "exit"
                ? "animate-works-exit"
                : animPhase === "enter"
                  ? "animate-works-enter"
                  : ""
            }
          >
            {view === "grid" ? (
              <>
                <div className="px-6 md:px-12 lg:px-16 mb-8">
                  <CategoryFilter
                    categories={years}
                    selected={selectedYear}
                    onSelect={setSelectedYear}
                  />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-1">
                  {filteredVideos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              </>
            ) : (
              <WorksMarquee videos={videos} />
            )}
          </div>
        </div>

        {/* 展开/收起开关 */}
        <div className="flex justify-center mt-8">
          <button
            onClick={toggleView}
            className="text-xs md:text-sm tracking-widest text-neutral-300 hover:text-white border border-neutral-400 hover:border-white px-5 py-2.5 transition-all duration-300"
          >
            {view === "grid" ? "收起 ⌃" : `显示全部作品 ⌄ ${videos.length}`}
          </button>
        </div>

        {showShowreel && (
          <ShowreelModal onClose={() => setShowShowreel(false)} />
        )}

      </div>
    </section>
  );
}
