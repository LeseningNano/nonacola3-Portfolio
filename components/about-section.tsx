import { siteConfig, socialLinks } from "@/lib/config";

export function AboutSection() {
  return (
    <section id="about" className="w-full bg-[#0a0a0a] px-6 md:px-12 lg:px-16 pt-16 pb-8">
<h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight">
    about.
  </h2>
      <p className="text-base md:text-lg text-neutral-400 font-light mt-2 md:mt-3">了解更多 & 合作洽谈</p>

      <div className="mt-10 flex flex-col md:flex-row gap-12 md:gap-16">
        <p className="text-base md:text-lg text-neutral-300 leading-relaxed max-w-2xl flex-1">
          我是nonacola3，是一名业余PV师，正在努力进步中。热爱影像创作（也爱打游戏），喜欢用视觉语言讲述故事。期待通过每一个作品不断打磨技术，也希望能与更多志同道合的朋友交流合作。
        </p>
        <div className="md:border-l md:border-neutral-800 md:pl-12 flex-shrink-0">
          <h3 className="text-xs text-neutral-500 uppercase tracking-widest mb-3 font-normal">Contact</h3>
          <a
            href={`mailto:${siteConfig.email}`}
            className="text-lg md:text-xl text-neutral-300 hover:text-white transition-colors block mb-6"
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
                className="px-4 py-2 border border-neutral-400 hover:border-white text-neutral-300 hover:text-white transition-all duration-300 text-sm"
              >
                {link.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
