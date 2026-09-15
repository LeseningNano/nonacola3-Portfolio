"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Menu, X } from "lucide-react";
import { siteConfig } from "@/lib/config";
import {
  getPortfolioMenuPrimary,
  shouldGateNavbarOnIntro,
} from "@/lib/portfolio-navigation";

const SECTIONS = [
  { id: "works", label: "WORKS" },
  { id: "news", label: "NEWS" },
  { id: "about", label: "ABOUT" },
];

const SCROLL_THRESHOLD = 80;

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openRafRef = useRef(0);
  const primaryItem = getPortfolioMenuPrimary(pathname);
  // 首页 / works 索引页有开场动画：导航栏等 portfolio-intro-done 再弹出，
  // 其他路由直接显示。reduced-motion 下不做隐藏。
  const [revealed, setRevealed] = useState(() => !shouldGateNavbarOnIntro(pathname));

  useLayoutEffect(() => {
    if (!shouldGateNavbarOnIntro(pathname)) {
      setRevealed(true);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRevealed(true);
      return;
    }
    setRevealed(false);
  }, [pathname]);

  // 用 useLayoutEffect 订阅：首页回访时 HeroVideo 在 useLayoutEffect 里同步派发
  // portfolio-intro-done，useEffect 订阅会晚于该派发导致事件丢失。
  useLayoutEffect(() => {
    function handleIntroDone() {
      setRevealed(true);
    }
    window.addEventListener("portfolio-intro-done", handleIntroDone);
    return () => window.removeEventListener("portfolio-intro-done", handleIntroDone);
  }, []);

  // 首页公告横幅在场时，导航栏切换为不透明背景（server-notice 派发）
  const [noticeOpen, setNoticeOpen] = useState(false);
  useEffect(() => {
    function handleNotice(event: Event) {
      const detail = (event as CustomEvent<{ open?: boolean }>).detail;
      setNoticeOpen(Boolean(detail?.open));
    }
    window.addEventListener("server-notice-open", handleNotice);
    return () => window.removeEventListener("server-notice-open", handleNotice);
  }, []);

  function openMenu() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    cancelAnimationFrame(openRafRef.current);
    // 先以收起态挂载（面板在屏幕外），等浏览器绘制该帧后再切到展开态，让滑入过渡能播放
    setMounted(true);
    openRafRef.current = requestAnimationFrame(() => {
      openRafRef.current = requestAnimationFrame(() => setOpen(true));
    });
  }

  function closeMenu() {
    if (!mounted) return;
    cancelAnimationFrame(openRafRef.current);
    setOpen(false);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setMounted(false);
      closeTimerRef.current = null;
    }, 320);
  }

  function handleSectionClick(e: React.MouseEvent, id: string) {
    e.preventDefault();
    closeMenu();
    const container = document.getElementById("main-scroll");
    const el = document.getElementById(id);
    if (container && el) {
      container.dispatchEvent(
        new CustomEvent("smooth-scroll-to", { detail: { target: el.offsetTop } })
      );
    } else if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      sessionStorage.setItem("pending-scroll", id);
      router.push("/");
    }
  }

  useEffect(() => {
    cancelAnimationFrame(openRafRef.current);
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpen(false);
    setMounted(false);
  }, [pathname]);

  useEffect(() => {
    function check() {
      // capture 阶段监听，无论哪个元素在滚动都能收到；
      // 每次都重新查 #main-scroll，避免 hydration 后节点替换导致监听失效。
      const container = document.getElementById("main-scroll");
      const y = container ? container.scrollTop : window.scrollY;
      const winY = window.scrollY;
      setScrolled(y > SCROLL_THRESHOLD || winY > SCROLL_THRESHOLD);
    }

    // 用 document capture 兜住所有滚动（桌面 #main-scroll、移动端 window），
    // 并对 #main-scroll 额外挂一个直接监听，双保险。
    document.addEventListener("scroll", check, { capture: true, passive: true });
    const container = document.getElementById("main-scroll");
    if (container) container.addEventListener("scroll", check, { passive: true });
    // 等渲染稳定后再校一次（防止初次挂载时数据还没到位）
    const t = setTimeout(check, 300);
    check();

    return () => {
      document.removeEventListener("scroll", check, { capture: true });
      if (container) container.removeEventListener("scroll", check);
      clearTimeout(t);
    };
  }, [pathname]);

  useEffect(() => {
    if (mounted) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [mounted]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      cancelAnimationFrame(openRafRef.current);
    };
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 motion-reduce:transition-none ${
        revealed ? "" : "-translate-y-full invisible"
      }`}
      style={{ transitionTimingFunction: "var(--ease-menu)" }}
    >
      <div
        className={`px-4 md:px-6 h-16 flex items-center justify-between transition-colors duration-300 ${
          noticeOpen
            ? "bg-black border-b border-white/5"
            : scrolled || mounted
              ? "bg-black/80 backdrop-blur-md border-b border-white/5"
              : ""
        }`}
      >
        <Link href="/" className="font-normal text-base md:text-lg" style={{ fontFamily: "var(--font-bitcount)" }}>
          {siteConfig.name}
        </Link>

        <button
          aria-label="菜单"
          className="text-neutral-300 hover:text-white transition-colors p-2 -mr-2"
          onClick={() => (open ? closeMenu() : openMenu())}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* 移动端：全屏覆盖菜单 */}
      {mounted && (
        <div
          className={`md:hidden fixed inset-0 top-16 z-30 bg-[#0a0a0a]/95 backdrop-blur-sm flex flex-col transition-transform duration-300 ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
          style={{ transitionTimingFunction: "var(--ease-menu)" }}
        >
          <div className="flex-1 flex flex-col items-start justify-center px-6 gap-1">
            {SECTIONS.map((s, i) => {
              const className = "text-3xl py-2 text-neutral-300 hover:text-white transition-colors animate-fade-in opacity-0";
              const style = {
                fontFamily: "var(--font-bitcount)",
                animationDelay: `${i * 60}ms`,
              };

              if (s.id === "works") {
                return (
                  <Link key={s.id} href={primaryItem.href} onClick={closeMenu} className={`${className} inline-flex items-center gap-3`} style={style}>
                    {primaryItem.direction === "back" && <ArrowLeft aria-hidden="true" className="h-6 w-6" />}
                    <span>{primaryItem.label}</span>
                    {primaryItem.direction === "forward" && <ArrowRight aria-hidden="true" className="h-6 w-6" />}
                  </Link>
                );
              }

              return (
                <a
                  key={s.id}
                  href={`/#${s.id}`}
                  onClick={(event) => handleSectionClick(event, s.id)}
                  className={className}
                  style={style}
                >
                  {s.label}
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* 桌面端：遮罩压黑 */}
      {mounted && (
        <div
          className={`hidden md:block fixed inset-0 top-16 z-20 bg-black/60 transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
          style={{ transitionTimingFunction: "var(--ease-menu)" }}
          onClick={closeMenu}
        />
      )}

      {/* 桌面端：右侧 1/4 宽面板 */}
      {mounted && (
        <div
          className={`hidden md:block fixed top-16 right-0 bottom-0 w-1/4 min-w-[320px] z-30 bg-[#0a0a0a]/95 backdrop-blur-sm border-l border-white/5 transition-transform duration-300 ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
          style={{ transitionTimingFunction: "var(--ease-menu)" }}
        >
          <div className="flex flex-col justify-center h-full px-8 lg:px-10 gap-2">
            {SECTIONS.map((s, i) => {
              const className = "text-3xl lg:text-4xl py-2 text-neutral-300 hover:text-white transition-colors animate-fade-in opacity-0";
              const style = {
                fontFamily: "var(--font-bitcount)",
                animationDelay: `${i * 60}ms`,
              };

              if (s.id === "works") {
                return (
                  <Link key={s.id} href={primaryItem.href} onClick={closeMenu} className={`${className} inline-flex items-center gap-3`} style={style}>
                    {primaryItem.direction === "back" && <ArrowLeft aria-hidden="true" className="h-7 w-7" />}
                    <span>{primaryItem.label}</span>
                    {primaryItem.direction === "forward" && <ArrowRight aria-hidden="true" className="h-7 w-7" />}
                  </Link>
                );
              }

              return (
                <a
                  key={s.id}
                  href={`/#${s.id}`}
                  onClick={(event) => handleSectionClick(event, s.id)}
                  className={className}
                  style={style}
                >
                  {s.label}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
