import { siteConfig, socialLinks } from "@/lib/config";

export function ContactSection() {
  return (
    <section className="py-20 px-4 max-w-7xl mx-auto border-t border-zinc-800">
      <h2 className="text-3xl font-bold mb-8">联系我</h2>
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
    </section>
  );
}
