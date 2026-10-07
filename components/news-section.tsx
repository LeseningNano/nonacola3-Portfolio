import type { PostItem } from "@/lib/types";
import { IntentPrefetchLink } from "@/components/intent-prefetch-link";
import { Reveal, SectionDim } from "@/components/viewport-reveal";
import { SectionHeading } from "@/components/section-heading";
import { getPostExcerpt } from "@/lib/post-excerpt";

export type { PostItem };

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export function NewsSection({ posts }: { posts: PostItem[] }) {
  const recent = posts.slice(0, 5);
  return (
    <section id="news" className="relative w-full bg-[#0a0a0a] px-6 md:px-12 lg:px-16 pt-16 pb-8">
      <SectionDim />
      <div className="page-cap">
        <SectionHeading title="news." subtitle="最新动态" />

        {recent.length === 0 ? (
          <p className="text-neutral-600 text-sm mt-8">暂无动态。</p>
        ) : (
          <Reveal variant="content" delay={320} className="mt-8 border-t border-neutral-800">
            {recent.map((post) => {
              const isArticle = post.title !== null;
              const inner = (
                <>
                  <span className="text-xs text-neutral-500 font-mono flex-shrink-0 w-12 md:w-12 pt-0.5 md:pt-0">
                    {formatDate(post.createdAt)}
                  </span>
                  {/* 文章标题在宽屏固定宽度，空出中段给摘要；短动态正文本身就是内容，仍占满 */}
                  <span
                    className={`text-sm md:text-base text-neutral-300 group-hover:text-white transition-colors min-w-0 flex-1 line-clamp-2 md:line-clamp-1 md:truncate ${
                      isArticle ? "lg:w-[26rem] lg:flex-none xl:w-[32rem]" : ""
                    }`}
                  >
                    {post.title ?? post.body}
                  </span>
                  {isArticle && (
                    <span
                      data-news-excerpt=""
                      className="hidden lg:block min-w-0 flex-1 truncate text-sm text-neutral-500 group-hover:text-neutral-400 transition-colors"
                    >
                      {getPostExcerpt(post.body)}
                    </span>
                  )}
                  {post.tag && (
                    <span className="hidden md:inline-block text-[10px] text-neutral-500 border border-neutral-800 px-2 py-0.5 flex-shrink-0">
                      {post.tag}
                    </span>
                  )}
                  {isArticle ? (
                    <span className="hidden md:inline text-xs text-neutral-500 group-hover:text-white transition-colors flex-shrink-0 ml-auto">
                      阅读全文 →
                    </span>
                  ) : (
                    // 占位：短动态没有「阅读全文」，留出同宽空位让标签与文章行对齐
                    <span aria-hidden="true" className="hidden md:inline invisible text-xs flex-shrink-0">阅读全文 →</span>
                  )}
                  {isArticle && (
                    <span className="md:hidden text-base text-neutral-600 group-hover:text-neutral-300 transition-colors duration-200 flex-shrink-0 leading-none">›</span>
                  )}
                </>
              );
              const rowClass =
                "row-sweep group flex items-start md:items-center gap-3 md:gap-4 lg:gap-8 px-3 md:px-4 py-3.5 border-b border-neutral-900";
              return isArticle ? (
                <IntentPrefetchLink key={post.id} href={`/news/${post.id}`} className={rowClass}>
                  {inner}
                </IntentPrefetchLink>
              ) : (
                <div key={post.id} className={rowClass}>
                  {inner}
                </div>
              );
            })}
          </Reveal>
        )}
      </div>
    </section>
  );
}
