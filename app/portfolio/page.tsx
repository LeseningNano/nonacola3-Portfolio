import type { Metadata } from "next";
import { ExternalLink, Mail } from "lucide-react";
import { getVideos } from "@/lib/data";
import { siteConfig } from "@/lib/config";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "HR 作品集",
  description: "nonacola3 的精选影像作品与创作项目。",
  robots: { index: true, follow: true },
};

function toExternalUrl(value: string) {
  const iframeSource = value.match(/src=["']([^"']+)["']/i)?.[1];
  const rawUrl = (iframeSource ?? value).startsWith("//")
    ? `https:${iframeSource ?? value}`
    : iframeSource ?? value;

  try {
    const url = new URL(rawUrl);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

function shortText(value: string | null) {
  if (!value) return "作品详情请点击查看。";
  return value.replace(/[#>*_`\[\]]/g, " ").replace(/\s+/g, " ").trim();
}

function getWorkYear(value: Date | string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.getFullYear();
}

export default async function PortfolioPage() {
  const videos = await getVideos();
  const featured = videos.filter((video) => video.featured);
  const works = (featured.length > 0 ? featured : videos).slice(0, 6);

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-6 pb-16 pt-28 md:px-12 md:pt-36 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-neutral-800 pb-10 md:pb-14">
          <p className="text-xs tracking-[0.24em] text-neutral-500">SELECTED WORKS · 2026</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-medium tracking-tight text-white md:text-6xl">
            影像作品集
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-neutral-400 md:text-lg">
            精选 PV 与影像创作项目。此页面不自动播放视频，也不加载外部播放器；点击具体作品后才会打开播放链接。
          </p>
          <a
            href={`mailto:${siteConfig.email}`}
            className="mt-7 inline-flex items-center gap-2 border border-neutral-600 px-4 py-2.5 text-sm text-neutral-200 transition-colors hover:border-white hover:text-white"
          >
            <Mail className="h-4 w-4" />
            {siteConfig.email}
          </a>
        </header>

        <section className="mt-10 md:mt-14" aria-labelledby="selected-works">
          <div className="mb-5 flex items-baseline justify-between gap-6">
            <h2 id="selected-works" className="text-sm tracking-[0.18em] text-neutral-500">SELECTED WORKS</h2>
            <span className="text-sm text-neutral-600">{works.length} projects</span>
          </div>

          {works.length > 0 ? (
            <div className="grid gap-px bg-neutral-800 md:grid-cols-2">
              {works.map((work, index) => {
                const externalUrl = toExternalUrl(work.embedUrl);
                const year = getWorkYear(work.date);
                return (
                  <article key={work.id} className="flex min-h-64 flex-col bg-[#101010] p-6 md:min-h-72 md:p-8">
                    <div className="flex items-start justify-between gap-6 text-xs text-neutral-500">
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      {year && <time dateTime={String(work.date)}>{year}</time>}
                    </div>
                    <div className="mt-auto">
                      <p className="text-xs tracking-wider text-neutral-500">{work.category}</p>
                      <h3 className="mt-3 text-2xl font-medium leading-tight text-white md:text-3xl">{work.title}</h3>
                      <p className="mt-4 line-clamp-3 max-w-xl text-sm leading-6 text-neutral-400">{shortText(work.summary ?? work.description)}</p>
                      {externalUrl ? (
                        <a
                          href={externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-6 inline-flex items-center gap-2 text-sm text-neutral-200 transition-colors hover:text-white"
                        >
                          查看作品 <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : (
                        <span className="mt-6 inline-block text-sm text-neutral-600">播放链接暂未提供</span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="border border-dashed border-neutral-800 p-8 text-neutral-500">尚未添加作品。</p>
          )}
        </section>

        <footer className="mt-14 border-t border-neutral-800 pt-6 text-sm text-neutral-600">
          如需完整作品、简历或合作信息，请邮件联系。
        </footer>
      </div>
    </main>
  );
}
