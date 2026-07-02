"use client";

import { siteConfig, socialLinks } from "@/lib/config";

export function Footer() {
  return (
    <footer className="w-full bg-[#0a0a0a] border-t border-zinc-800/50">
      <div className="px-6 md:px-12 lg:px-16 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-sm text-zinc-500">
              &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
            </p>
            <p className="text-xs text-zinc-600 mt-1">
              Built with Next.js &middot; Deployed on Vercel
            </p>
          </div>
          <div className="flex items-center gap-4">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors duration-300"
              >
                {link.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
