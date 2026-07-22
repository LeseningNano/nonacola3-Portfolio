"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { siteConfig } from "@/lib/config";

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
  const [scrolled, setScrolled] = useState(false);

  function handleSectionClick(e: React.MouseEvent, id: string) {
    e.preventDefault();
    setOpen(false);
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
      const container = document.getElementById("main-scroll");
      const y = container ? container.scrollTop : window.scrollY;
      const winY = window.scrollY;
      setScrolled(y > SCROLL_THRESHOLD || winY > SCROLL_THRESHOLD);
    }

    const container = document.getElementById("main-scroll");
    if (container) container.addEventListener("scroll", check, { passive: true });
    window.addEventListener("scroll", check, { passive: true });
    // 等渲染稳定后再校一次（防止初次挂载时数据还没到位）
    const t = setTimeout(check, 300);
    check();

    return () => {
      if (container) container.removeEventListener("scroll", check);
      window.removeEventListener("scroll", check);
      clearTimeout(t);
    };
  }, [pathname]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-40">
      <div
        className={`px-4 md:px-6 h-16 flex items-center justify-between transition-colors duration-300 ${
          scrolled || open ? "bg-black/80 backdrop-blur-md border-b border-white/5" : ""
        }`}
      >
        <Link href="/" className="font-normal text-base md:text-lg" style={{ fontFamily: "var(--font-bitcount)" }}>
          {siteConfig.name}
        </Link>

        <button
          aria-label="菜单"
          className="text-neutral-300 hover:text-white transition-colors p-2 -mr-2"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* 移动端：全屏覆盖菜单 */}
      {open && (
        <div className="md:hidden fixed inset-0 top-16 z-30 bg-[#0a0a0a]/95 backdrop-blur-sm animate-fade-in flex flex-col">
          <div className="flex-1 flex flex-col items-start justify-center px-6 gap-1">
            {SECTIONS.map((s, i) => (
              <a
                key={s.id}
                href={`/#${s.id}`}
                onClick={(e) => handleSectionClick(e, s.id)}
                className="text-3xl py-2 text-neutral-300 hover:text-white transition-colors animate-fade-in-down opacity-0"
                style={{ fontFamily: "var(--font-bitcount)", animationDelay: `${i * 60}ms` }}
              >
                {s.label}
              </a>
            ))}
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="text-base py-3 text-neutral-500 hover:text-neutral-300 transition-colors animate-fade-in-down opacity-0"
              style={{ animationDelay: `${SECTIONS.length * 60}ms` }}
            >
              管理
            </Link>
          </div>
        </div>
      )}

      {/* 桌面端：右侧 1/4 宽面板 */}
      {open && (
        <div className="hidden md:block fixed top-16 right-0 bottom-0 w-1/4 min-w-[320px] z-30 bg-[#0a0a0a]/95 backdrop-blur-sm animate-fade-in-down border-l border-white/5">
          <div className="flex flex-col justify-center h-full px-8 lg:px-10 gap-2">
            {SECTIONS.map((s, i) => (
              <a
                key={s.id}
                href={`/#${s.id}`}
                onClick={(e) => handleSectionClick(e, s.id)}
                className="text-3xl lg:text-4xl py-2 text-neutral-300 hover:text-white transition-colors animate-fade-in-down opacity-0"
                style={{ fontFamily: "var(--font-bitcount)", animationDelay: `${i * 60}ms` }}
              >
                {s.label}
              </a>
            ))}
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="text-sm lg:text-base py-3 mt-2 text-neutral-500 hover:text-neutral-300 transition-colors animate-fade-in-down opacity-0 border-t border-white/5"
              style={{ animationDelay: `${SECTIONS.length * 60}ms` }}
            >
              管理
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}