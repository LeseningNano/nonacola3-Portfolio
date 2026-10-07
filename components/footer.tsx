"use client";

import { ArrowUp } from "lucide-react";
import { siteConfig } from "@/lib/config";
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

// 页脚宽度跟随所在页面的正文，左右边缘对齐：
// home  = 首页区块（lg 64px 边距 + .page-cap 1920 上限）
// works = /works 的 main（max-w-[1200px] 及同样的内边距）
// 社交链接不放页脚：首页 about. 与 /works 联系区各自列出。
const WIDTH_CLASS = {
  home: "px-6 md:px-12 lg:px-16",
  works: "",
} as const;

const INNER_CLASS = {
  home: "page-cap",
  works: "mx-auto max-w-[1200px] px-5 sm:px-8 md:px-12",
} as const;

export function Footer({ width = "home" }: { width?: keyof typeof INNER_CLASS }) {
  return (
    <footer className="w-full bg-[#0a0a0a] border-t border-neutral-800/50 mt-24">
      <div className={`${WIDTH_CLASS[width]} py-6`.trim()}>
        <div className={`${INNER_CLASS[width]} flex flex-col md:flex-row items-start md:items-center justify-between gap-6`}>
          <p className="text-sm text-neutral-500">
            &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
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
    </footer>
  );
}
