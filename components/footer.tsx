"use client";

import { ArrowUp } from "lucide-react";
import { siteConfig, socialLinks } from "@/lib/config";
import { SCROLL_CONTAINER_ID } from "@/components/smooth-scroll-container";

// 回到顶部：交给 SmoothScrollContainer 的 smooth-scroll-to 通道，
// 桌面容器滚动、移动端窗口滚动与减少动态效果都由它统一处理。
function scrollToTop() {
  const container = document.getElementById(SCROLL_CONTAINER_ID);
  if (container) {
    container.dispatchEvent(new CustomEvent("smooth-scroll-to", { detail: { target: 0 } }));
    return;
  }
  window.scrollTo({ top: 0 });
}

// showSocial：首页 about. 已列出社交链接，页脚不再重复；/works 没有 about 区，保留。
export function Footer({ showSocial = true }: { showSocial?: boolean }) {
  return (
    <footer className="w-full bg-[#0a0a0a] border-t border-neutral-800/50 mt-24">
      <div className="px-6 md:px-12 lg:px-16 py-6">
        <div className="page-cap flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <p className="text-sm text-neutral-500">
            &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            {showSocial &&
              socialLinks.map((link) => (
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
            <button
              type="button"
              onClick={scrollToTop}
              className="group inline-flex min-h-11 items-center gap-2 text-xs tracking-widest text-neutral-400 transition-colors duration-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              style={{ fontFamily: "var(--font-bitcount)" }}
            >
              BACK TO TOP
              <ArrowUp
                aria-hidden="true"
                className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 motion-reduce:transition-none"
              />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
