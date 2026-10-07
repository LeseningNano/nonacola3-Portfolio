import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, getPublishedPosts } from "@/lib/data";
import { MarkdownBody } from "@/components/markdown-body";
import { ReturnLink } from "@/components/scroll-memory";
import { formatFullDate } from "@/lib/news-timeline";
import { getArticleNeighbors } from "@/lib/news-neighbors";
import type { PostItem } from "@/lib/types";

export const dynamic = "force-static";
export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post || post.title === null || !post.published) return {};
  return { title: post.title };
}

const META = "text-xs tracking-[0.24em] text-neutral-500";

export default async function NewsPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post, posts] = await Promise.all([getPost(id), getPublishedPosts()]);
  if (!post || post.title === null || !post.published) notFound();

  const { older, newer } = getArticleNeighbors(
    posts.map((p): PostItem => ({ ...p, createdAt: new Date(p.createdAt).toISOString() })),
    post.id
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-28 pb-20 px-6 md:px-12 md:pt-36">
      {/* 版心 52rem：标题区、正文文字和结尾收在居中的 38rem，图片和视频可以放宽到 52rem */}
      <div className="mx-auto max-w-[52rem]">
        <header className="mx-auto max-w-[38rem]">
          <p className={META}>
            {formatFullDate(post.createdAt)}
            {post.tag && <span> · {post.tag}</span>}
          </p>
          <h1 className="mt-4 break-words text-4xl font-normal leading-[1.12] tracking-[-0.03em] text-white md:text-[56px]">
            {post.title}
          </h1>
          <div className="mt-10 mb-12 h-px bg-neutral-800 md:mt-12 md:mb-14" />
        </header>

        <MarkdownBody content={post.body} wideMedia />

        <footer className="mx-auto mt-16 max-w-[38rem] border-t border-neutral-800 pt-8">
          {/* 上一篇（更早）/ 下一篇（更新），只在文章之间切换；没有的一侧留空 */}
          {(older || newer) && (
            <nav aria-label="文章导航" className="grid grid-cols-2 gap-6">
              <div>
                {older && (
                  <Link href={`/news/${older.id}`} className="group block">
                    <span className={META}>← PREV</span>
                    <span className="mt-2 block text-sm leading-relaxed text-neutral-300 transition-colors group-hover:text-white md:text-base">
                      {older.title}
                    </span>
                  </Link>
                )}
              </div>
              <div className="text-right">
                {newer && (
                  <Link href={`/news/${newer.id}`} className="group block">
                    <span className={META}>NEXT →</span>
                    <span className="mt-2 block text-sm leading-relaxed text-neutral-300 transition-colors group-hover:text-white md:text-base">
                      {newer.title}
                    </span>
                  </Link>
                )}
              </div>
            </nav>
          )}
          <ReturnLink
            href="/"
            page="home"
            section="news"
            className={`inline-block py-2 text-sm text-neutral-400 transition-colors hover:text-white ${older || newer ? "mt-10" : ""}`}
          >
            ← 返回 News
          </ReturnLink>
        </footer>
      </div>
    </div>
  );
}
