"use client";

import Link from "next/link";
import { siteConfig } from "@/lib/config";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-40">
      <div className="px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-normal text-lg" style={{ fontFamily: "'Bitcount Grid Single', sans-serif" }}>
          {siteConfig.name}
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/reel"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            REEL
          </Link>
          <Link
            href="/about"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            关于
          </Link>
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
