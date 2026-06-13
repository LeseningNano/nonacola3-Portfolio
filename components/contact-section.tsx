import { siteConfig, socialLinks } from "@/lib/config";

export function ContactSection() {
  return (
    <section id="contact" className="h-screen w-full bg-[#0a0a0a] flex items-center">
      <div className="pt-20 pb-20 px-4 max-w-7xl mx-auto w-full">
        <h2 className="text-2xl md:text-3xl font-bold mb-8 font-[family-name:var(--font-pixel)]">关于我 & 联系</h2>
        <p className="text-zinc-400 mb-10 max-w-2xl leading-relaxed">
          我是一名业余PV师，正在努力进步中。热爱影像创作，喜欢用视觉语言讲述故事。期待通过每一个作品不断打磨技术，也希望能与更多志同道合的朋友交流合作。
        </p>
        <div className="flex flex-col md:flex-row gap-12">
          <div>
            <p className="text-zinc-400 mb-4">期待与你合作</p>
            <a
              href={`mailto:${siteConfig.email}`}
              className="text-xl hover:text-zinc-300 transition-colors"
            >
              {siteConfig.email}
            </a>
          </div>
          <div>
            <p className="text-zinc-400 mb-4">社交媒体</p>
            <div className="flex gap-4">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors text-sm"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
