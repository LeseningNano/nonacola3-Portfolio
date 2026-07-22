"use client";

import { siteConfig, socialLinks } from "@/lib/config";

export function Footer() {
  return (
    <footer className="w-full bg-[#0a0a0a] border-t border-neutral-800/50 mt-24">
      <div className="px-6 md:px-12 lg:px-16 py-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-sm text-neutral-500">
              &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
            </p>
            <p className="text-xs text-neutral-600 mt-1">
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
                className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors duration-300"
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
