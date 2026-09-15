"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AlertTriangle, X } from "lucide-react";
import Link from "next/link";
import { shouldShowServerNotice } from "@/lib/portfolio-navigation";

// 横幅完全展开后的停留时长
const AUTO_CLOSE_MS = 3000;

export function ServerNotice() {
  const pathname = usePathname();
  const active = shouldShowServerNotice(pathname);
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [closing, setClosing] = useState(false);
  const rafRef = useRef(0);

  // 仅首页显示；等首页开场动画结束（导航栏弹出的同一时刻）再展开，
  // 避免横幅悬在尚未出现的导航栏下方。
  // 用 useLayoutEffect 订阅：首页回访时 HeroVideo 在 useLayoutEffect 里同步派发
  // portfolio-intro-done，useEffect 订阅会晚于该派发导致事件丢失。
  useLayoutEffect(() => {
    if (!active) return;
    const dismissed = sessionStorage.getItem("server-notice-dismissed");
    if (dismissed) return;

    function handleIntroDone() {
      setMounted(true);
      // 双 rAF 确保浏览器先把 0fr 起始帧提交，再切到 1fr 触发过渡
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => setExpanded(true));
      });
    }

    window.addEventListener("portfolio-intro-done", handleIntroDone);
    return () => {
      window.removeEventListener("portfolio-intro-done", handleIntroDone);
      cancelAnimationFrame(rafRef.current);
    };
  }, [active]);

  // 切换页面时立即关闭（导航栏恢复自身透明逻辑）
  useEffect(() => {
    if (active) return;
    setMounted(false);
    setExpanded(false);
    setClosing(false);
  }, [active]);

  // 展开：通知导航栏进入不透明态；3s 后自动关闭（本会话不再显示）。
  // 收起统一走 cleanup 派发 open:false，覆盖自动关闭 / 手动关闭 / 切页三种路径。
  useEffect(() => {
    if (!expanded) return;
    window.dispatchEvent(
      new CustomEvent("server-notice-open", { detail: { open: true } })
    );
    const timer = setTimeout(dismiss, AUTO_CLOSE_MS);
    return () => {
      clearTimeout(timer);
      window.dispatchEvent(
        new CustomEvent("server-notice-open", { detail: { open: false } })
      );
    };
  }, [expanded]);

  function dismiss() {
    setClosing(true);
    setExpanded(false);
    sessionStorage.setItem("server-notice-dismissed", "1");
    // 350ms 收成一条线 → 150ms 淡出 → 卸载
    setTimeout(() => setMounted(false), 500);
  }

  if (!mounted || !active) return null;

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
              网页访问较慢，敬请谅解。了解详情→
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
