"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Menu, X } from "lucide-react";
import { siteConfig } from "@/lib/config";
import {
  NAV_SECTION_IDS,
  getActiveNavSection,
  getPortfolioMenuPrimary,
  getScrollProgress,
  shouldGateNavbarOnIntro,
  shouldShowScrollProgress,
  type NavSectionId,
} from "@/lib/portfolio-navigation";
import { isAdminPath } from "@/lib/admin-navigation";

const SECTIONS: Array<{ id: NavSectionId; label: string }> = [
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
  const [activeSection, setActiveSection] = useState<NavSectionId | null>(null);
  const [hoveredSection, setHoveredSection] = useState<NavSectionId | null>(null);
  const linkRefs = useRef<Partial<Record<NavSectionId, HTMLAnchorElement | null>>>({});
  const underlineRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const showProgress = shouldShowScrollProgress(pathname);
  const underlineTarget = hoveredSection ?? activeSection;

  // 下划线直接写 DOM 样式（不走 state），悬停预览优先于滚动位置
  useLayoutEffect(() => {
    function place() {
      const underline = underlineRef.current;
      if (!underline) return;
      const link = underlineTarget ? linkRefs.current[underlineTarget] : null;
      if (!link) {
        underline.style.opacity = "0";
        return;
      }
      underline.style.opacity = "1";
      underline.style.width = `${link.offsetWidth}px`;
      underline.style.transform = `translateX(${link.offsetLeft}px)`;
    }
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [underlineTarget]);
  // 首页 / works 索引页有开场动画：导航栏等 portfolio-intro-done 再弹出，
  // 其他路由直接显示。reduced-motion 下不做隐藏。
  const [revealed, setRevealed] = useState(() => !shouldGateNavbarOnIntro(pathname));

  /* eslint-disable react-hooks/set-state-in-effect -- route transitions must synchronously reset the reveal state before paint. */
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
  /* eslint-enable react-hooks/set-state-in-effect */

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

  /* eslint-disable react-hooks/set-state-in-effect -- route changes must immediately close the existing public navigation menu. */
  useEffect(() => {
    cancelAnimationFrame(openRafRef.current);
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpen(false);
    setMounted(false);
  }, [pathname]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    function check() {
      // capture 阶段监听，无论哪个元素在滚动都能收到；
      // 每次都重新查 #main-scroll，避免 hydration 后节点替换导致监听失效。
      const container = document.getElementById("main-scroll");
      const y = container ? container.scrollTop : window.scrollY;
      const winY = window.scrollY;
      setScrolled(y > SCROLL_THRESHOLD || winY > SCROLL_THRESHOLD);

      // 容器只在桌面滚动；手机以 window 为准（与 HeroVideo 相同的判断）
      const containerScrolls = container !== null && container.scrollHeight > container.clientHeight;
      const scrollTop = containerScrolls ? container.scrollTop : window.scrollY;
      const viewport = containerScrolls ? container.clientHeight : window.innerHeight;
      const scrollHeight = containerScrolls
        ? container.scrollHeight
        : document.documentElement.scrollHeight;

      const tops: Partial<Record<NavSectionId, number>> = {};
      for (const id of NAV_SECTION_IDS) {
        const el = document.getElementById(id);
        if (el) tops[id] = el.offsetTop;
      }
      setActiveSection(getActiveNavSection(pathname, tops, scrollTop, viewport, scrollHeight));

      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${getScrollProgress(scrollTop, scrollHeight, viewport)})`;
      }
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

  if (isAdminPath(pathname)) return null;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 motion-reduce:transition-none ${
        revealed ? "" : "-translate-y-full invisible"
      }`}
      style={{ transitionTimingFunction: "var(--ease-menu)" }}
    >
      {showProgress && (
        <div
          ref={progressRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px origin-left bg-white"
          style={{ transform: "scaleX(0)" }}
        />
      )}
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

        <div
          className="relative hidden items-center gap-10 md:flex"
          onMouseLeave={() => setHoveredSection(null)}
        >
          {SECTIONS.map((s) => {
            const className = `py-2 text-[13px] tracking-[0.2em] transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
              activeSection === s.id ? "text-white" : "text-neutral-300 hover:text-white"
            }`;
            const hoverProps = {
              onMouseEnter: () => setHoveredSection(s.id),
              onFocus: () => setHoveredSection(s.id),
              onBlur: () => setHoveredSection(null),
            };

            if (s.id === "works") {
              return (
                <Link
                  key={s.id}
                  ref={(el) => {
                    linkRefs.current.works = el;
                  }}
                  href="/works"
                  aria-current={pathname === "/works" ? "page" : undefined}
                  className={className}
                  {...hoverProps}
                >
                  {s.label}
                </Link>
              );
            }

            return (
              <a
                key={s.id}
                ref={(el) => {
                  linkRefs.current[s.id] = el;
                }}
                href={`/#${s.id}`}
                onClick={(event) => handleSectionClick(event, s.id)}
                className={className}
                {...hoverProps}
              >
                {s.label}
              </a>
            );
          })}
          <span
            ref={underlineRef}
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-0 h-px bg-white opacity-0 transition-[transform,width,opacity] duration-[400ms] motion-reduce:transition-none"
            style={{ transitionTimingFunction: "var(--ease-menu)" }}
          />
        </div>

        <button
          aria-label="菜单"
          className="text-neutral-300 hover:text-white transition-colors p-2 -mr-2 md:hidden"
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
    </nav>
  );
}
