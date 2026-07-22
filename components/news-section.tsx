import Link from "next/link";
import type { PostItem } from "@/lib/types";

export type { PostItem };

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const monthDay = `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  // 非当年显示 YYYY.MM.DD，当年只显示 MM.DD
  return d.getFullYear() === now.getFullYear()
    ? monthDay
    : `${d.getFullYear()}.${monthDay}`;
}

export function NewsSection({ posts }: { posts: PostItem[] }) {
  const recent = posts.slice(0, 5);
  return (
    <section id="news" className="w-full bg-[#0a0a0a] px-6 md:px-12 lg:px-16 pt-16 pb-12">
      <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight">
        news.
      </h2>
      <p className="text-base md:text-lg text-neutral-400 font-light mt-3 md:mt-4">最新动态</p>

      {recent.length === 0 ? (
        <p className="text-neutral-500 text-sm mt-8">暂无动态。</p>
      ) : (
        <div className="mt-12 border-t border-neutral-800">
          {recent.map((post) => {
            const inner = (
              <>
                <span className="text-xs text-neutral-500 font-mono flex-shrink-0 w-12 pt-0.5 md:pt-0">
                  {formatDate(post.createdAt)}
                </span>
                <h3 className="text-sm md:text-base text-neutral-300 group-hover:text-white transition-colors min-w-0 flex-1 line-clamp-2 md:line-clamp-1 md:truncate leading-normal font-normal">
                  {post.title ?? post.body}
                </h3>
                {post.tag && (
                  <span className="hidden md:inline-block text-xs text-neutral-500 border border-neutral-800 px-2 py-0.5 flex-shrink-0">
                    {post.tag}
                  </span>
                )}
                {post.title && (
                  <span className="hidden md:inline text-xs text-neutral-500 group-hover:text-white transition-colors flex-shrink-0 ml-auto">
                    阅读全文 →
                  </span>
                )}
              </>
            );
            const rowClass =
              "group relative flex items-start md:items-center gap-3 md:gap-4 px-3 md:px-4 py-3.5 border-b border-neutral-900 hover:bg-white/5 transition-colors duration-200 before:absolute before:left-0 before:top-0 before:h-full before:w-0.5 before:bg-white before:scale-y-0 hover:before:scale-y-100 before:transition-transform before:duration-200 before:origin-center";
            return post.title ? (
              <Link key={post.id} href={`/news/${post.id}`} className={rowClass}>
                {inner}
              </Link>
            ) : (
              <div key={post.id} className={rowClass}>
                {inner}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
