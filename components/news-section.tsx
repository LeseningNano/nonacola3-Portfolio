import type { ReactNode } from "react";
import type { PostItem } from "@/lib/types";
import { IntentPrefetchLink } from "@/components/intent-prefetch-link";
import { Reveal, SectionDim } from "@/components/viewport-reveal";
import { SectionHeading } from "@/components/section-heading";
import { buildNewsTimeline, type NewsTimelineEntry } from "@/lib/news-timeline";

export type { PostItem };

const BITCOUNT = { fontFamily: "var(--font-bitcount)" };

// 首页 news.：日志式时间轴。左侧像素字日期（年份只在首条和跨年处标出），
// 中间竖线串起各条，最新一条实心方点；右侧标签、标题与两行摘要。
// 文章整块可点进详情，短动态只展示正文。
export function NewsSection({ posts }: { posts: PostItem[] }) {
  const entries = buildNewsTimeline(posts);
  return (
    <section id="news" className="relative w-full bg-[#0a0a0a] px-6 md:px-12 lg:px-16 pt-16 pb-8">
      <SectionDim />
      <div className="page-cap">
        <SectionHeading title="news." subtitle="最新动态" />

        {entries.length === 0 ? (
          <p className="text-neutral-600 text-sm mt-8">暂无动态。</p>
        ) : (
          <Reveal variant="content" delay={320} className="mt-10 md:mt-12">
            <ol data-news-timeline="">
              {entries.map((entry, index) => (
                <li key={entry.id}>
                  <TimelineEntry entry={entry} latest={index === 0} last={index === entries.length - 1} />
                </li>
              ))}
            </ol>
          </Reveal>
        )}
      </div>
    </section>
  );
}

function TimelineEntry({ entry, latest, last }: { entry: NewsTimelineEntry; latest: boolean; last: boolean }) {
  const isArticle = entry.kind === "article";
  const rowClass =
    "group grid grid-cols-[4.5rem_1.25rem_minmax(0,1fr)] gap-x-3 md:grid-cols-[11rem_2rem_minmax(0,1fr)] md:gap-x-6";

  const body: ReactNode = (
    <>
      {/* 日期列 */}
      <div className="pt-0.5 text-right">
        {entry.year && (
          <div className="font-mono text-[11px] tracking-[0.1em] text-neutral-500 md:text-xs">{entry.year}</div>
        )}
        <div
          className={`text-xl leading-tight md:text-[40px] md:leading-[1.1] ${latest ? "text-white" : "text-neutral-400"}`}
          style={BITCOUNT}
        >
          {entry.date}
        </div>
      </div>

      {/* 竖线与方点：首条从方点向下画，末条只画到方点 */}
      <div aria-hidden="true" className="relative flex justify-center">
        <span
          className={`absolute w-px bg-neutral-800 ${latest ? "top-3" : "top-0"} ${last ? "h-3" : "bottom-0"}`}
        />
        {latest ? (
          <span data-news-dot="latest" className="relative mt-2 size-[9px] bg-white" />
        ) : (
          <span
            data-news-dot="past"
            className="relative mt-2 size-[9px] border border-neutral-400 bg-[#0a0a0a] transition-colors duration-300 md:group-hover:border-white"
          />
        )}
      </div>

      {/* 内容 */}
      <div className={`flex min-w-0 flex-col gap-2 ${last ? "" : "pb-8 md:pb-9"}`}>
        {entry.tag && (
          <span className="self-start border border-neutral-800 px-2 py-px text-[11px] text-neutral-500">{entry.tag}</span>
        )}
        {isArticle ? (
          <>
            <span className="text-base text-neutral-100 transition-colors duration-300 md:text-xl md:group-hover:text-white">
              {entry.title}
              <span
                aria-hidden="true"
                className="ml-2 inline-block text-neutral-500 transition-transform duration-300 motion-reduce:transition-none md:group-hover:translate-x-1 md:group-hover:text-white"
              >
                →
              </span>
            </span>
            {entry.text && (
              <span className="line-clamp-2 max-w-[60rem] text-sm leading-relaxed text-neutral-400 md:text-[15px]">
                {entry.text}
              </span>
            )}
          </>
        ) : (
          <span className="max-w-[60rem] text-sm leading-relaxed text-neutral-300 md:text-[17px]">{entry.text}</span>
        )}
      </div>
    </>
  );

  return isArticle ? (
    <IntentPrefetchLink
      href={`/news/${entry.id}`}
      data-news-entry=""
      className={`${rowClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white`}
    >
      {body}
    </IntentPrefetchLink>
  ) : (
    <div data-news-entry="" className={rowClass}>
      {body}
    </div>
  );
}
