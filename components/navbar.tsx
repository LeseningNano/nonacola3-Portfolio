"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { siteConfig } from "@/lib/config";

const SECTIONS = [
  { id: "works", label: "WORKS" },
  { id: "news", label: "NEWS" },
  { id: "about", label: "ABOUT" },
];

export function Navbar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

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
      // 不在主页：先记录目标板块，再导航回主页
      sessionStorage.setItem("pending-scroll", id);
      router.push("/");
    }
  }

  // 菜单展开时禁用背景滚动
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
      <div className="px-4 md:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-normal text-base md:text-lg" style={{ fontFamily: "var(--font-bitcount)" }}>
          {siteConfig.name}
        </Link>

        {/* 桌面端导航 */}
        <div className="hidden md:flex items-center gap-6">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`/#${s.id}`}
              onClick={(e) => handleSectionClick(e, s.id)}
              className="link-sweep text-sm text-neutral-400 hover:text-white transition-colors"
            >
              {s.label}
            </a>
          ))}
          <Link
            href="/dashboard"
            className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            管理
          </Link>
        </div>

        {/* 移动端汉堡按钮 */}
        <button
          aria-label="菜单"
          className="md:hidden text-neutral-300 hover:text-white transition-colors p-2 -mr-2"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* 移动端下拉菜单 */}
      {open && (
        <div className="md:hidden fixed inset-0 top-16 z-30 bg-[#0a0a0a]/95 backdrop-blur-sm">
          <div className="flex flex-col px-6 py-6 gap-1">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`/#${s.id}`}
                onClick={(e) => handleSectionClick(e, s.id)}
                className="text-2xl py-3 text-neutral-300 hover:text-white transition-colors border-b border-neutral-900"
                style={{ fontFamily: "var(--font-bitcount)" }}
              >
                {s.label}
              </a>
            ))}
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="text-lg py-3 text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              管理
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}