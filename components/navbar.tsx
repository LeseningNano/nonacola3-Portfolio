"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { siteConfig } from "@/lib/config";

type NavItem = { label: string; kind: "route" | "anchor"; target: string };

const NAV_ITEMS: NavItem[] = [
  { label: "WORKS", kind: "route", target: "/works" },
  { label: "NEWS", kind: "anchor", target: "news" },
  { label: "ABOUT", kind: "anchor", target: "about" },
  { label: "CONTACT", kind: "anchor", target: "contact" },
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

  function handleAnchorClick(e: React.MouseEvent, id: string) {
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

  // 路由变化时收起菜单。WORKS 等路由项的点击被全局过渡监听
  // preventDefault+stopPropagation 拦截，React onClick 收不到，需此处兜底。
  useEffect(() => {
    closeMenu();
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
    <nav className="fixed top-0 left-0 right-0 z-40">
      <div
        className={`px-4 md:px-6 h-16 flex items-center justify-between transition-colors duration-300 ${
          scrolled || mounted ? "bg-black/80 backdrop-blur-md border-b border-white/5" : ""
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
            {NAV_ITEMS.map((item, i) =>
              item.kind === "route" ? (
                <a
                  key={item.label}
                  href={item.target}
                  onClick={closeMenu}
                  className="text-3xl py-2 text-neutral-300 hover:text-white transition-colors animate-fade-in opacity-0"
                  style={{ fontFamily: "var(--font-bitcount)", animationDelay: `${i * 60}ms` }}
                >
                  {item.label}
                </a>
              ) : (
                <a
                  key={item.label}
                  href={`/#${item.target}`}
                  onClick={(e) => handleAnchorClick(e, item.target)}
                  className="text-3xl py-2 text-neutral-300 hover:text-white transition-colors animate-fade-in opacity-0"
                  style={{ fontFamily: "var(--font-bitcount)", animationDelay: `${i * 60}ms` }}
                >
                  {item.label}
                </a>
              )
            )}
            <Link
              href="/dashboard"
              onClick={closeMenu}
              className="text-base py-3 text-neutral-500 hover:text-neutral-300 transition-colors animate-fade-in opacity-0"
              style={{ animationDelay: `${NAV_ITEMS.length * 60}ms` }}
            >
              管理
            </Link>
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
            {NAV_ITEMS.map((item, i) =>
              item.kind === "route" ? (
                <a
                  key={item.label}
                  href={item.target}
                  onClick={closeMenu}
                  className="text-3xl lg:text-4xl py-2 text-neutral-300 hover:text-white transition-colors animate-fade-in opacity-0"
                  style={{ fontFamily: "var(--font-bitcount)", animationDelay: `${i * 60}ms` }}
                >
                  {item.label}
                </a>
              ) : (
                <a
                  key={item.label}
                  href={`/#${item.target}`}
                  onClick={(e) => handleAnchorClick(e, item.target)}
                  className="text-3xl lg:text-4xl py-2 text-neutral-300 hover:text-white transition-colors animate-fade-in opacity-0"
                  style={{ fontFamily: "var(--font-bitcount)", animationDelay: `${i * 60}ms` }}
                >
                  {item.label}
                </a>
              )
            )}
            <Link
              href="/dashboard"
              onClick={closeMenu}
              className="text-sm lg:text-base py-3 mt-2 text-neutral-500 hover:text-neutral-300 transition-colors animate-fade-in opacity-0 border-t border-white/5"
              style={{ animationDelay: `${NAV_ITEMS.length * 60}ms` }}
            >
              管理
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
