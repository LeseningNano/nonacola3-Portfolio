import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { siteConfig, socialLinks } from "@/lib/config";
import { getPosts } from "@/lib/data";

export default async function AboutPage() {
  const posts = await getPosts();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-2xl mx-auto px-6 py-24 md:py-32">
        {/* about me. */}
        <section>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight" style={{ fontFamily: "var(--font-bitcount)" }}>about me.</h2>
          <p className="text-base md:text-lg text-zinc-400 font-light mt-1">了解更多 & 合作洽谈</p>
          <p className="text-base md:text-lg text-zinc-300 leading-relaxed mt-8">
            我是nonacola3，是一名业余PV师，正在努力进步中。热爱影像创作（也爱打游戏），喜欢用视觉语言讲述故事。期待通过每一个作品不断打磨技术，也希望能与更多志同道合的朋友交流合作。
          </p>
        </section>

        {/* news. */}
        <section className="mt-20">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight" style={{ fontFamily: "var(--font-bitcount)" }}>news.</h2>
          <p className="text-base md:text-lg text-zinc-400 font-light mt-1">最新动态 & 制作幕后</p>
          {posts.length === 0 ? (
            <p className="text-sm text-zinc-500 mt-8">暂无动态。</p>
          ) : (
            <div className="mt-8 border-t border-zinc-800">
              {posts.map((post) => {
                const dateStr = new Date(post.date).toLocaleDateString("zh-CN", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                }).replace(/\//g, ".");
                const inner = (
                  <>
                    <span className="text-sm md:text-base text-zinc-200 group-hover:text-white transition-colors truncate">
                      {post.title}
                    </span>
                    <span className="flex items-center gap-2 flex-shrink-0 ml-4">
                      <span className="text-xs md:text-sm text-zinc-500 tabular-nums">{dateStr}</span>
                      {post.url && (
                        <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                      )}
                    </span>
                  </>
                );
                return post.url ? (
                  <a
                    key={post.id}
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between py-4 border-b border-zinc-800/60 hover:border-zinc-700 transition-colors"
                  >
                    {inner}
                  </a>
                ) : (
                  <div
                    key={post.id}
                    className="group flex items-center justify-between py-4 border-b border-zinc-800/60"
                  >
                    {inner}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* contact */}
        <section className="mt-20">
          <p className="text-sm text-zinc-500 uppercase tracking-wider mb-4">期待与你合作</p>
          <a
            href={`mailto:${siteConfig.email}`}
            className="text-2xl md:text-3xl hover:text-zinc-300 transition-colors break-all"
          >
            {siteConfig.email}
          </a>
          <div className="flex flex-wrap gap-3 mt-8">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 border border-zinc-400 hover:border-white text-zinc-300 hover:text-white transition-all duration-300 text-base"
              >
                {link.name}
              </a>
            ))}
          </div>
        </section>

        <div className="mt-20">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white border border-zinc-400 hover:border-white px-4 py-2 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            返回主页
          </Link>
        </div>
      </div>
    </div>
  );
}
