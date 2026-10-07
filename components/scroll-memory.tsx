"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { SCROLL_CONTAINER_ID } from "@/components/smooth-scroll-container";
import {
  finishRestore,
  markBack,
  planReturn,
  scrollPosKey,
  takeRestore,
  type ReturnPage,
} from "@/lib/return-navigation";

// 桌面在 #main-scroll 容器里滚动，手机是整个窗口（与 HeroVideo 的判断一致）
function scrollTarget(): { get: () => number; set: (top: number) => void; source: HTMLElement | Window } {
  const container = document.getElementById(SCROLL_CONTAINER_ID);
  if (container && container.scrollHeight > container.clientHeight) {
    return { get: () => container.scrollTop, set: (top) => { container.scrollTop = top; }, source: container };
  }
  return { get: () => window.scrollY, set: (top) => window.scrollTo({ top }), source: window };
}

function safeSession(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

// 放在首页 / Works 页：滚动时记下位置；从详情页返回（返回链接或浏览器后退）时恢复
export function ScrollMemory({ page }: { page: ReturnPage }) {
  useEffect(() => {
    const storage = safeSession();
    if (!storage) return;

    let frame = 0;
    let restoreFrame = 0;
    let cancelRestore = () => {};
    const saved = takeRestore(storage, page);
    if (saved !== null) {
      // 页面刚挂载的几帧里容器可能还没排好版，或被路由切换重置回顶部：
      // 约 1 秒内逐帧校正，连续 6 帧都停在目标位置才算完成；用户一动滚轮 / 触摸就立刻停手。
      // 瞬间定位、不做平滑滚动，避免看到页面从顶部滑下来。
      let held = 0;
      let frames = 0;
      // done：恢复完成或用户接管时清掉标记；组件卸载（开发模式的二次挂载）时保留，下一次挂载继续
      const stop = (done = true) => {
        if (done) finishRestore(storage);
        cancelAnimationFrame(restoreFrame);
        window.removeEventListener("wheel", userTookOver);
        window.removeEventListener("touchstart", userTookOver);
        window.removeEventListener("keydown", userTookOver);
      };
      cancelRestore = () => stop(false);
      const userTookOver = () => stop(true);
      window.addEventListener("wheel", userTookOver, { passive: true });
      window.addEventListener("touchstart", userTookOver, { passive: true });
      window.addEventListener("keydown", userTookOver);
      const tick = () => {
        const target = scrollTarget();
        if (Math.abs(target.get() - saved) <= 2) held += 1;
        else {
          held = 0;
          target.set(saved);
        }
        frames += 1;
        if (held >= 6 || frames >= 60) stop();
        else restoreFrame = requestAnimationFrame(tick);
      };
      restoreFrame = requestAnimationFrame(tick);
    }

    const target = scrollTarget();
    function save() {
      frame = 0;
      storage?.setItem(scrollPosKey(page), String(Math.round(scrollTarget().get())));
    }
    function onScroll() {
      if (!frame) frame = requestAnimationFrame(save);
    }
    target.source.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      target.source.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
      cancelRestore();
    };
  }, [page]);

  return null;
}

// 挂在根布局：浏览器后退 / 前进时打标记，落地页的 ScrollMemory 据此恢复位置
export function BackNavigationFlag() {
  useEffect(() => {
    function onPopState() {
      const storage = safeSession();
      if (storage) markBack(storage);
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  return null;
}

// 详情页的「返回」链接：有记录回原位置，没有就回所属板块（首页 works / news），再没有回顶部
export function ReturnLink({
  href,
  page,
  section,
  className,
  children,
}: {
  href: string;
  page: ReturnPage;
  section?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      data-return-page={page}
      data-return-section={section}
      onClick={() => {
        const storage = safeSession();
        if (storage) planReturn(storage, page, section);
      }}
      className={className}
    >
      {children}
    </Link>
  );
}
