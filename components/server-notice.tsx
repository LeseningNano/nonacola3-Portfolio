"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import Link from "next/link";

export function ServerNotice() {
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [closing, setClosing] = useState(false);
  const rafRef = useRef(0);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("server-notice-dismissed");
    if (dismissed) return;

    const timer = setTimeout(() => {
      setMounted(true);
      // 双 rAF 确保浏览器先把 0fr 起始帧提交，再切到 1fr 触发过渡
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => setExpanded(true));
      });
    }, 3500);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const dismiss = () => {
    setClosing(true);
    setExpanded(false);
    sessionStorage.setItem("server-notice-dismissed", "1");
    // 350ms 收成一条线 → 150ms 淡出 → 卸载
    setTimeout(() => setMounted(false), 500);
  };

  if (!mounted) return null;

  return (
    <div
      className="fixed top-16 left-0 right-0 z-30 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-700 overflow-hidden"
      style={{
        display: "grid",
        gridTemplateRows: expanded ? "1fr" : "0fr",
        opacity: closing ? 0 : 1,
        transition:
          "grid-template-rows 350ms cubic-bezier(0.22, 1, 0.36, 1), opacity 150ms ease 300ms",
      }}
    >
      <div className="overflow-hidden">
        <div className="flex items-center justify-center gap-3 px-4 md:px-6 py-2.5">
          <Link
            href="/news/cmrs2x02p000004jyhpbp2iki"
            className="flex items-center justify-center gap-3 flex-1 min-w-0 text-center hover:text-white transition-colors"
          >
            <AlertTriangle className="w-4 h-4 text-white flex-shrink-0" />
            <p className="text-xs md:text-sm text-neutral-300 leading-relaxed">
              服务器位于海外，缩略图与视频资源加载可能较慢。点击了解详情与后续优化计划。
            </p>
          </Link>
          <button
            onClick={dismiss}
            aria-label="关闭"
            className="text-neutral-500 hover:text-white transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}