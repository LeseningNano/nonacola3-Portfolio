"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { siteConfig } from "@/lib/config";

const SECTIONS = [
  { id: "works", label: "WORKS" },
  { id: "news", label: "NEWS" },
  { id: "about", label: "ABOUT" },
];

export function Navbar() {
  const router = useRouter();

  function handleSectionClick(e: React.MouseEvent, id: string) {
    e.preventDefault();
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

  return (
    <nav className="fixed top-0 left-0 right-0 z-40">
      <div className="px-4 md:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-normal text-base md:text-lg" style={{ fontFamily: "var(--font-bitcount)" }}>
          {siteConfig.name}
        </Link>
        <div className="flex items-center gap-3 md:gap-6">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`/#${s.id}`}
              onClick={(e) => handleSectionClick(e, s.id)}
              className="link-sweep text-xs md:text-sm text-neutral-400 hover:text-white transition-colors"
            >
              {s.label}
            </a>
          ))}
          <Link
            href="/dashboard"
            className="text-xs md:text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            管理
          </Link>
        </div>
      </div>
    </nav>
  );
}
