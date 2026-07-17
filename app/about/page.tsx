import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { siteConfig, socialLinks } from "@/lib/config";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center">
      <div className="py-20 px-6 md:px-12 lg:px-16 max-w-7xl mx-auto w-full">
        <div className="mb-12">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight" style={{ fontFamily: "var(--font-bitcount)" }}>about me.</h2>
          <p className="text-base md:text-lg text-zinc-400 font-light mt-1">了解更多 & 合作洽谈</p>
        </div>
        <p className="text-lg md:text-xl text-zinc-300 mb-14 max-w-2xl leading-relaxed">
          我是nonacola3，是一名业余PV师，正在努力进步中。热爱影像创作（也爱打游戏），喜欢用视觉语言讲述故事。期待通过每一个作品不断打磨技术，也希望能与更多志同道合的朋友交流合作。
        </p>
        <div className="flex flex-col md:flex-row gap-16">
          <div>
            <p className="text-sm text-zinc-500 uppercase tracking-wider mb-4">期待与你合作</p>
            <a
              href={`mailto:${siteConfig.email}`}
              className="text-2xl md:text-3xl hover:text-zinc-300 transition-colors"
            >
              {siteConfig.email}
            </a>
          </div>
          <div>
            <p className="text-sm text-zinc-500 uppercase tracking-wider mb-4">社交媒体</p>
            <div className="flex flex-wrap gap-3">
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
          </div>
        </div>
        <div className="mt-16">
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
