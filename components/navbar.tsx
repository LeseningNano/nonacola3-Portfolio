"use client";

import Link from "next/link";
import { siteConfig } from "@/lib/config";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg">
          {siteConfig.name}
        </Link>
        <div className="flex items-center gap-6">
          <a href="#works" className="text-sm text-zinc-400 hover:text-white transition-colors">
            作品
          </a>
          <a href="#contact" className="text-sm text-zinc-400 hover:text-white transition-colors">
            联系
          </a>
          <Link
            href="/dashboard"
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            管理
          </Link>
        </div>
      </div>
    </nav>
  );
}
