import Image from "next/image";
import { siteConfig, socialLinks } from "@/lib/config";
import { Reveal, SectionDim } from "@/components/viewport-reveal";
import { SectionHeading } from "@/components/section-heading";

export function AboutSection() {
  return (
    <section id="about" className="relative w-full bg-[#0a0a0a] px-6 md:px-12 lg:px-16 pt-16 pb-8">
      <SectionDim />
      <div className="page-cap">
        <SectionHeading title="about." subtitle="了解更多 & 合作洽谈" />

        <div className="mt-10 flex flex-col md:flex-row md:items-center gap-10 md:gap-16">
          {/* 头像与简介成组，组内间距更紧；Contact 栏仍用较大间距隔开 */}
          <div className="flex flex-1 flex-col gap-6 md:flex-row md:items-center md:gap-8">
            {/* 头像：中线亮起后上下拉开，与首页加载画面、Showreel 同一母题 */}
            <Reveal variant="avatar" delay={240} className="relative h-32 w-32 shrink-0 md:h-52 md:w-52 2xl:h-60 2xl:w-60">
              <div className="avatar-frame absolute inset-0 overflow-hidden border border-neutral-800 bg-neutral-900">
                <Image
                  src="/avatar.webp"
                  alt="nonacola3 的头像"
                  fill
                  sizes="(max-width: 767px) 128px, (max-width: 1535px) 208px, 240px"
                  className="avatar-image object-cover"
                />
              </div>
              <span aria-hidden="true" className="avatar-seam pointer-events-none absolute inset-x-0 top-1/2 h-px bg-white" />
            </Reveal>

            <Reveal
              as="p"
              variant="content-left"
              delay={420}
              className="text-base md:text-lg 2xl:text-xl text-neutral-300 leading-relaxed max-w-2xl 2xl:max-w-3xl flex-1"
            >
              我是nonacola3，曾用名ナノナ。
              <br />
              进厂打工，业余玩AE，还在努力进步中。
              <br />
              想把脑海里的画面做成炫酷好看的作品，用它们讲故事。欢迎志同道合的朋友来聊。
            </Reveal>
          </div>

          <Reveal variant="content-left" delay={540} className="md:border-l md:border-neutral-800 md:pl-12 flex-shrink-0">
            <p className="text-xs md:text-sm text-neutral-500 uppercase tracking-widest mb-3 md:mb-4">Contact</p>
            <a
              href={`mailto:${siteConfig.email}`}
              className="text-xl md:text-2xl hover:text-neutral-300 transition-colors block mb-6 md:mb-8"
            >
              {siteConfig.email}
            </a>
            <div className="flex flex-wrap gap-2">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 border border-neutral-400 hover:border-white text-neutral-300 hover:text-white transition-all duration-300 text-sm md:text-base"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
