"use client";

import { useEffect, useLayoutEffect, useState, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const [opacity, setOpacity] = useState(0);
  const [visible, setVisible] = useState(false);
  const [instant, setInstant] = useState(false);
  const isTransitioning = useRef(false);
  const prevPathname = useRef(pathname);
  const cloneRef = useRef<HTMLImageElement | null>(null);

  // 路由变化完成 → 克隆图飞向播放器 / 黑场淡出
  // useLayoutEffect：在浏览器绘制新页面前就位，保证后退导航也能被黑场覆盖
  useIsomorphicLayoutEffect(() => {
    if (pathname === prevPathname.current) return;
    prevPathname.current = pathname;

    // 未经拦截的导航（浏览器前进/后退、外部跳转）：
    // 立即盖上黑场（无过渡），再淡出揭示新页面
    if (!isTransitioning.current) {
      setInstant(true);
      setVisible(true);
      setOpacity(1);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setInstant(false);
          setOpacity(0);
          setTimeout(() => setVisible(false), 220);
        });
      });
      return;
    }

    const clone = cloneRef.current;

    const finish = () => {
      if (cloneRef.current) {
        cloneRef.current.remove();
        cloneRef.current = null;
      }
      setVisible(false);
      isTransitioning.current = false;
    };

    if (!clone) {
      setTimeout(() => {
        setOpacity(0);
        setTimeout(finish, 200);
      }, 50);
      return;
    }

    // 等详情页播放器出现，把缩略图克隆飞过去
    const tryPlace = (attempts: number) => {
      const target = document.querySelector("[data-vt-player]");
      if (target) {
        const r = target.getBoundingClientRect();
        clone.style.transition =
          "left 350ms ease, top 350ms ease, width 350ms ease, height 350ms ease, opacity 250ms ease";
        clone.style.left = `${r.left}px`;
        clone.style.top = `${r.top}px`;
        clone.style.width = `${r.width}px`;
        clone.style.height = `${r.height}px`;
        // 黑场同步淡出，露出新页面
        setOpacity(0);
        setTimeout(() => {
          clone.style.opacity = "0";
          setTimeout(finish, 260);
        }, 350);
      } else if (attempts > 0) {
        requestAnimationFrame(() => tryPlace(attempts - 1));
      } else {
        // 兜底：播放器迟迟未出现，直接淡出
        setOpacity(0);
        clone.style.transition = "opacity 250ms ease";
        clone.style.opacity = "0";
        setTimeout(finish, 260);
      }
    };
    setTimeout(() => tryPlace(90), 60);
  }, [pathname]);

  // 通用黑场过渡
  const startTransition = useCallback(
    (url: string) => {
      if (isTransitioning.current) return;
      isTransitioning.current = true;

      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setOpacity(1));
      });

      setTimeout(() => {
        router.push(url);
      }, 200);
    },
    [router]
  );

  // 作品卡片 → 详情页：缩略图克隆 + 黑场过渡
  const startWorkTransition = useCallback(
    (href: string, anchor: HTMLAnchorElement) => {
      if (isTransitioning.current) return;
      isTransitioning.current = true;

      router.prefetch(href);

      const card = anchor.querySelector("[data-vt-id]") as HTMLElement | null;
      const img = card?.querySelector("img") as HTMLImageElement | null;
      if (card && img) {
        const rect = card.getBoundingClientRect();
        const clone = document.createElement("img");
        clone.src = img.currentSrc || img.src;
        clone.alt = "";
        Object.assign(clone.style, {
          position: "fixed",
          left: `${rect.left}px`,
          top: `${rect.top}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          objectFit: "cover",
          zIndex: "10000",
          pointerEvents: "none",
        });
        document.body.appendChild(clone);
        cloneRef.current = clone;
      }

      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setOpacity(1));
      });

      setTimeout(() => {
        router.push(href);
      }, 200);
    },
    [router]
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (isTransitioning.current) {
        e.preventDefault();
        return;
      }

      // Let browser handle new-tab / download / modified clicks natively
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // 页内锚点（/#works 等）由导航栏自行处理，不做黑场过渡
      if (href.includes("#")) return;

      if (href.startsWith("/") && !href.startsWith("//")) {
        if (href.startsWith("/dashboard") || href.startsWith("/login")) return;
        // Don't intercept if already on this page
        if (href === pathname) return;

        e.preventDefault();
        e.stopPropagation();

        // 作品卡片 → 详情页：缩略图共享元素过渡
        if (href.startsWith("/works/")) {
          startWorkTransition(href, anchor);
          return;
        }

        startTransition(href);
      }
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [startTransition, startWorkTransition, pathname]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-[#0a0a0a] pointer-events-none"
      style={{ opacity, transition: instant ? "none" : "opacity 200ms ease-in-out" }}
    />
  );
}
