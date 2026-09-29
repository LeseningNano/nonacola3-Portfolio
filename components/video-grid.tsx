"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { WorkCard } from "./work-card";
import { ShowreelModal } from "./showreel-modal";
import { Reveal, SectionDim } from "./viewport-reveal";
import { SectionHeading } from "./section-heading";
import { formatWorkMeta, getWorkYear, selectHomeWorks } from "@/lib/works-index";
import type { VideoRow } from "@/lib/types";

// 首页 works. 区：整齐网格（桌面 3 列 / 平板 2 列 / 手机 1 列），
// 手机只显示前 3 个，全部作品去 /works 看。
export function VideoGrid({ videos }: { videos: VideoRow[] }) {
  const [showShowreel, setShowShowreel] = useState(false);
  const works = selectHomeWorks(videos);

  return (
    <section id="works" className="relative w-full bg-[#0a0a0a]">
      <SectionDim />
      <div className="px-6 pt-16 md:px-12 lg:px-16">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <SectionHeading title="works." subtitle="精选视频作品与创作项目" />
          <Reveal variant="content" delay={320} className="self-start md:self-auto">
            <Link
              href="/works"
              className="group inline-flex min-h-11 items-center gap-2 border border-neutral-400 px-5 py-2.5 text-xs tracking-widest text-neutral-300 transition-all duration-300 hover:border-white hover:text-white md:text-sm"
              style={{ fontFamily: "var(--font-bitcount)" }}
            >
              ALL WORKS
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </Reveal>
        </div>

        {works.length === 0 ? (
          <p className="mt-10 text-sm text-neutral-500">作品正在更新中。</p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {works.map((work, index) => (
              <Reveal
                key={work.id}
                variant="card"
                delay={(index % 3) * 100}
                className={index >= 3 ? "hidden sm:block" : undefined}
              >
                <WorkCard
                  work={work}
                  href={`/works/${work.id}?from=home`}
                  meta={formatWorkMeta([work.category, getWorkYear(work.date)])}
                  sizes="(max-width: 639px) calc(100vw - 48px), (max-width: 1023px) calc(50vw - 56px), calc(33vw - 64px)"
                />
              </Reveal>
            ))}
          </div>
        )}

        <Reveal variant="content" delay={200} className="mt-12">
          <button
            type="button"
            onClick={() => setShowShowreel(true)}
            className="group flex h-12 w-full items-center justify-between bg-neutral-900 px-5 transition-colors duration-300 hover:bg-neutral-800"
          >
            <span className="flex items-center gap-3">
              <span className="translate-y-px text-sm tracking-wider text-neutral-500 md:text-base" style={{ fontFamily: "var(--font-bitcount)" }}>
                REEL
              </span>
              <span className="text-sm text-neutral-400 transition-colors duration-300 group-hover:text-white md:text-base">
                视觉创作总结
              </span>
            </span>
            <span
              aria-hidden="true"
              className="pulse-ring relative flex h-7 w-7 items-center justify-center rounded-full border border-white/40 text-[10px] text-neutral-300"
            >
              ▶
            </span>
          </button>
        </Reveal>
      </div>

      {showShowreel && <ShowreelModal onClose={() => setShowShowreel(false)} />}
    </section>
  );
}
