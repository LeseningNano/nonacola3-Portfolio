# 站点重构 Implementation Plan（Hero 入场简化 + /works 独立页 + 首页重组）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 首屏入场简化为「logo 淡入 → 页面淡入」；works 拆为 `/works` 独立页（默认沉浸纵向流，可切换紧凑网格）；首页重排为 Hero→about→news→works预览→footer；导航改混合模型并新增 CONTACT。

**Architecture:** `/works` 为独立 Server Component 页（window 滚动，不复用首页 `#main-scroll` lerp 机制）；首页删 VideoGrid 换轻量 WorksPreview；hero 入场层替换 LoadingScreen/nudge；navbar 从纯锚点改为 route/anchor 混合项。既有机制按需保留：lerp 滚动、pending-scroll 回跳、克隆飞入过渡（`data-vt-id`）、黑场路由过渡。

**Tech Stack:** Next.js 16 (App Router/Turbopack)、Tailwind v4、lucide-react。验证：`npx tsc --noEmit` + `npx next build` + 手动清单（项目无测试框架）。

**设计文档:** `docs/superpowers/specs/2026-08-24-site-restructure-design.md`

---

### Task 1: Hero 入场简化

**Files:**
- Modify: `components/hero-video.tsx`（大幅精简）
- Delete: `components/loading-screen.tsx`

- [ ] **Step 1: 重写 hero-video.tsx**

整文件替换为：

```tsx
"use client";

import { useEffect, useRef, useState, useLayoutEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { SCROLL_CONTAINER_ID } from "./home-client";

export function HeroVideo({ videoUrl }: { videoUrl: string | null }) {
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [introFading, setIntroFading] = useState(false);
  const [introIn, setIntroIn] = useState(false);
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const rafId = useRef(0);

  // Parallax + scroll-driven styles: write to DOM directly, no React re-render
  useLayoutEffect(() => {
    function getScrollTop() {
      const container = document.getElementById(SCROLL_CONTAINER_ID);
      // 容器仅在 md+ 是滚动元素；移动端由 window 滚动
      if (container && container.clientHeight < container.scrollHeight) {
        return container.scrollTop;
      }
      return window.scrollY;
    }

    function apply() {
      rafId.current = 0;
      const scrollTop = getScrollTop();
      const heroHeight = window.innerHeight;
      if (scrollTop > heroHeight) return;

      const progress = scrollTop / heroHeight;

      if (videoWrapRef.current) {
        videoWrapRef.current.style.transform = `translateY(${scrollTop * 0.4}px)`;
      }
      if (videoRef.current) {
        videoRef.current.style.filter = `blur(4px) brightness(${0.5 - progress * 0.3})`;
      }
      const fade = Math.max(0, 1 - progress * 2.5);
      if (contentRef.current) {
        contentRef.current.style.opacity = String(fade);
      }
      if (ctaRef.current) {
        ctaRef.current.style.opacity = String(fade);
        ctaRef.current.style.pointerEvents =
          progress <= 0.45 ? "auto" : "none";
      }
    }

    function onScroll() {
      if (!rafId.current) rafId.current = requestAnimationFrame(apply);
    }

    const container = document.getElementById(SCROLL_CONTAINER_ID);
    const isContainerScroll = container && container.clientHeight < container.scrollHeight;
    const target: HTMLElement | Window = isContainerScroll ? container! : window;
    target.addEventListener("scroll", onScroll, { passive: true });
    if (isContainerScroll) window.addEventListener("scroll", onScroll, { passive: true });

    apply();

    return () => {
      target.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  // Logo 入场层显隐：pre-loader 黑底兜底期间由 React 接管。
  // 回访（sessionStorage 有 hero-loaded）直接跳过。
  useLayoutEffect(() => {
    if (sessionStorage.getItem("hero-loaded")) {
      setShowIntro(false);
      return;
    }
    requestAnimationFrame(() => setIntroIn(true));
    setTimeout(() => {
      const p = document.getElementById("pre-loader");
      if (p) p.remove();
    }, 260);
  }, []);

  // 时间线：淡入 500ms → 停留 400ms → 淡出 450ms → 卸载并写入回访标记
  useEffect(() => {
    if (!showIntro || !introIn || introFading) return;
    const t1 = setTimeout(() => setIntroFading(true), 900);
    const t2 = setTimeout(() => {
      sessionStorage.setItem("hero-loaded", "1");
      setShowIntro(false);
    }, 1350);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [showIntro, introIn, introFading]);

  return (
    <>
      {/* Logo 入场层 */}
      {showIntro && (
        <div
          className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex items-center justify-center"
          style={{
            opacity: introFading ? 0 : introIn ? 1 : 0,
            transition: introFading ? "opacity 450ms ease" : introIn ? "opacity 500ms ease" : "none",
            pointerEvents: introFading ? "none" : "auto",
          }}
        >
          <span className="text-3xl md:text-5xl text-white tracking-tight" style={{ fontFamily: "var(--font-bitcount)" }}>
            {siteConfig.name}
          </span>
        </div>
      )}

      <section id="hero" className="relative h-screen w-full overflow-hidden bg-[#0a0a0a]">
        {/* Background / Video Layer */}
        <div
          ref={videoWrapRef}
          className="absolute z-0"
          style={{
            top: "-10%",
            left: "-5%",
            right: "-5%",
            bottom: "-10%",
            willChange: "transform",
          }}
        >
          {videoUrl ? (
            <video
              ref={videoRef}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              onCanPlay={() => setIsVideoReady(true)}
              className={`w-full h-full object-cover scale-110 transition-opacity duration-1000 ${
                isVideoReady ? "opacity-100" : "opacity-0"
              }`}
              style={{ filter: "blur(4px) brightness(0.5)" }}
              src={videoUrl}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-neutral-900 to-[#0a0a0a]" />
          )}
        </div>

        {/* Halftone Texture Layer */}
        <div
          className="absolute inset-0 z-[3] pointer-events-none opacity-[0.5]"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.9) 0.3px, transparent 0.3px)",
            backgroundSize: "1.5px 1.5px",
            transform: "rotate(45deg) scale(3)",
          }}
        />

        {/* Content Layer */}
        <div ref={contentRef} className="absolute bottom-28 md:bottom-28 left-4 md:left-20 z-10 text-left">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-normal tracking-tight mb-3" style={{ fontFamily: "var(--font-montserrat)" }}>
            {siteConfig.name}
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl text-neutral-400 font-light" style={{ fontFamily: "var(--font-montserrat)" }}>
            {siteConfig.title}
          </p>
        </div>

        <Link
          ref={ctaRef}
          href="/works"
          className="group absolute bottom-12 md:bottom-28 right-1/2 translate-x-1/2 md:right-24 md:translate-x-0 z-10 text-[13px] md:text-sm lg:text-base xl:text-lg pt-3 md:pt-3.5 pb-2 md:pb-2.5 pl-4 md:pl-5 pr-3 md:pr-4 hover:pr-5 md:hover:pr-6 text-neutral-300 hover:text-white transition-all duration-300 cursor-pointer border border-neutral-400 hover:border-white flex items-center gap-2"
          style={{ fontFamily: "var(--font-bitcount)" }}
        >
          跳转至 works.
          <ArrowRight className="w-3 h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      </section>
    </>
  );
}
```

要点：删除 LoadingScreen 引用、playNudge/finishIntro/handleLoadReady/introDoneRef/loadTriggered/nudgeRaf/fadeOut/showLoader/loaderVisible 全部相关代码；视频不再阻塞入场。

- [ ] **Step 2: 删除 loading-screen.tsx**

```bash
git rm components/loading-screen.tsx
```

- [ ] **Step 3: 类型检查**

Run: `npx tsc --noEmit`
Expected: 无输出。若报 loading-screen 相关残留引用，检查是否还有其他文件 import 它（应只有 hero-video 已移除）。

- [ ] **Step 4: 构建验证**

Run: `npx next build 2>&1 | Select-String "Compiled|Failed|error" | Select-Object -First 10`
Expected: 含 `Compiled successfully`

- [ ] **Step 5: 提交**

```bash
git add components/hero-video.tsx
git commit -m "refactor(hero): simplify intro to logo fade-in then page reveal"
```

---

### Task 2: `/works` 独立页面（沉浸流 + 网格切换）

**Files:**
- Create: `components/works-client.tsx`
- Create: `app/works/page.tsx`

- [ ] **Step 1: 创建 `components/works-client.tsx`**

```tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Rows3, Grid2x2 } from "lucide-react";
import { VideoCard } from "./video-card";
import { CategoryFilter } from "./category-filter";
import { ShowreelModal } from "./showreel-modal";
import type { VideoRow } from "@/lib/types";

type ViewMode = "immersive" | "grid";

export function WorksClient({ videos }: { videos: VideoRow[] }) {
  const [view, setView] = useState<ViewMode>("immersive");
  const [selectedYear, setSelectedYear] = useState("全部");
  const [showShowreel, setShowShowreel] = useState(false);

  const years = useMemo(() => {
    const set = new Set<string>();
    for (const v of videos) {
      if (v.date) set.add(new Date(v.date).getFullYear().toString());
    }
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [videos]);

  const filteredVideos =
    selectedYear === "全部"
      ? videos
      : videos.filter((v) => v.date && new Date(v.date).getFullYear().toString() === selectedYear);

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        {/* 标题行 */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight" style={{ fontFamily: "var(--font-bitcount)" }}>
              works.
            </h2>
            <p className="text-base md:text-lg text-neutral-400 font-light mt-1">全部视频作品与创作项目</p>
          </div>
          <button
            aria-label={view === "immersive" ? "切换到网格视图" : "切换到沉浸视图"}
            onClick={() => setView((v) => (v === "immersive" ? "grid" : "immersive"))}
            className="text-neutral-400 hover:text-white border border-neutral-700 hover:border-neutral-400 p-2.5 transition-colors"
          >
            {view === "immersive" ? <Grid2x2 className="w-5 h-5" /> : <Rows3 className="w-5 h-5" />}
          </button>
        </div>

        {/* Showreel 横条 */}
        <div className="mb-10">
          <button
            onClick={() => setShowShowreel(true)}
            className="w-full h-12 bg-neutral-900 hover:bg-neutral-800 transition-colors duration-300 cursor-pointer group flex items-center justify-between px-4 md:px-6"
          >
            <div className="flex items-center gap-3">
              <span className="text-neutral-500 text-sm md:text-base tracking-wider translate-y-px" style={{ fontFamily: "var(--font-bitcount)" }}>REEL</span>
              <span className="text-sm md:text-base text-neutral-400 group-hover:text-white transition-colors duration-300">视觉创作总结</span>
            </div>
            <PlayGlyph />
          </button>
        </div>

        {/* 视图主体 */}
        {videos.length === 0 ? (
          <p className="text-neutral-600 text-sm mt-8">暂无作品。</p>
        ) : (
          <div key={view} className={view === "grid" ? "animate-works-expand" : "animate-works-collapse"}>
            {view === "immersive" ? (
              <div className="flex flex-col gap-6">
                {filteredVideos.map((video) => (
                  <ImmersiveCard key={video.id} video={video} />
                ))}
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <CategoryFilter categories={years} selected={selectedYear} onSelect={setSelectedYear} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1">
                  {filteredVideos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {showShowreel && <ShowreelModal onClose={() => setShowShowreel(false)} />}
    </div>
  );
}

function ImmersiveCard({ video }: { video: VideoRow }) {
  return (
    <Link
      href={`/works/${video.id}`}
      data-vt-id={video.id}
      aria-label={video.title}
      className="group relative block aspect-video md:aspect-[21/9] overflow-hidden transform-gpu"
    >
      {video.thumbnail ? (
        <div className="absolute inset-0 transition-transform duration-300 group-hover:scale-[1.03]">
          <Image src={video.thumbnail} alt={video.title} fill sizes="(max-width: 1152px) 100vw, 1152px" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-neutral-800" />
      )}
      <div className="absolute bottom-0 left-0 p-4 md:p-6 z-10">
        <span className="block text-xs md:text-sm text-neutral-400 mb-1">{video.category}</span>
        <span className="block text-base md:text-xl lg:text-2xl text-white font-medium">{video.title}</span>
      </div>
    </Link>
  );
}

function PlayGlyph() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-neutral-600 group-hover:text-neutral-400 transition-colors duration-300">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
```

说明：沉浸卡用原生 svg 三角而非 lucide Play，与旧横条的 ▶ 形态一致且更轻；`data-vt-id` 使详情页克隆飞入过渡生效。

- [ ] **Step 2: 创建 `app/works/page.tsx`**

```tsx
import type { Metadata } from "next";
import { getVideos } from "@/lib/data";
import { WorksClient } from "@/components/works-client";
import type { VideoRow } from "@/lib/types";

export const metadata: Metadata = {
  title: "Works",
};

export default async function WorksPage() {
  const videos = await getVideos();
  const serialized: VideoRow[] = videos.map((v) => ({
    id: v.id,
    title: v.title,
    description: v.description,
    summary: v.summary,
    category: v.category,
    embedUrl: v.embedUrl,
    thumbnail: v.thumbnail,
    featured: v.featured,
    order: v.order,
    date: v.date ? new Date(v.date).toISOString() : null,
  }));

  return <WorksClient videos={serialized} />;
}
```

- [ ] **Step 3: 类型检查**

Run: `npx tsc --noEmit`
Expected: 无输出

- [ ] **Step 4: 构建验证**

Run: `npx next build 2>&1 | Select-String "Compiled|Failed|error" | Select-Object -First 10`
Expected: 含 `Compiled successfully`，路由表出现 `/works`

- [ ] **Step 5: 提交**

```bash
git add components/works-client.tsx app/works/page.tsx
git commit -m "feat(works): standalone /works page with immersive/grid views"
```

---

### Task 3: 首页重组（about 上移 + works 预览 + 清理）

**Files:**
- Create: `components/works-preview.tsx`
- Modify: `components/home-client.tsx`（板块顺序与导入）
- Modify: `components/about-section.tsx`（联系块加 id="contact"）
- Delete: `components/video-grid.tsx`、`components/works-marquee.tsx`
- Modify: `app/globals.css`（删 marquee/flicker 死样式）

- [ ] **Step 1: 创建 `components/works-preview.tsx`**

```tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { VideoCard } from "./video-card";
import type { VideoRow } from "@/lib/types";

export function WorksPreview({ videos }: { videos: VideoRow[] }) {
  const preview = videos.slice(0, 4);
  if (preview.length === 0) return null;

  return (
    <section id="works-preview" className="w-full bg-[#0a0a0a] px-6 md:px-12 lg:px-16 pt-16 pb-12">
      <h2 className="text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight" style={{ fontFamily: "var(--font-bitcount)" }}>
        works.
      </h2>
      <p className="text-base md:text-lg text-neutral-400 font-light mt-1">精选作品 · 完整列表见全部</p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1">
        {preview.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>

      <div className="flex justify-center mt-10">
        <Link
          href="/works"
          className="inline-flex items-center gap-2 text-xs md:text-sm tracking-widest text-neutral-300 hover:text-white border border-neutral-400 hover:border-white px-5 py-2.5 transition-all duration-300"
        >
          查看全部作品
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: home-client.tsx 调整顺序与导入**

导入区把 `import { VideoGrid } from "@/components/video-grid";` 替换为 `import { WorksPreview } from "@/components/works-preview";`；渲染区改为：

```tsx
      <HeroVideo videoUrl={heroVideoUrl} />
      <AboutSection />
      <NewsSection posts={posts} />
      <WorksPreview videos={videos} />
      <Footer />
```

- [ ] **Step 3: about-section.tsx 联系块加锚点**

将 `<div className="md:border-l md:border-neutral-800 md:pl-12 flex-shrink-0">` 改为：

```tsx
        <div id="contact" className="md:border-l md:border-neutral-800 md:pl-12 flex-shrink-0">
```

- [ ] **Step 4: 删除废弃组件与死样式**

```bash
git rm components/video-grid.tsx components/works-marquee.tsx
```

`app/globals.css` 删除以下三段（marquee 与 flicker 已无消费者；works-expand/collapse 保留给 /works 用）：
- `@keyframes marquee { ... }`、`.animate-marquee { ... }`、`.marquee-container:hover .animate-marquee { ... }`
- `@keyframes flicker-in { ... }`

- [ ] **Step 5: 类型检查**

Run: `npx tsc --noEmit`
Expected: 无输出（若报 ShowreelModal/video-card 未用导出警告可忽略——它们被 /works 使用）

- [ ] **Step 6: 构建验证**

Run: `npx next build 2>&1 | Select-String "Compiled|Failed|error" | Select-Object -First 10`
Expected: 含 `Compiled successfully`

- [ ] **Step 7: 提交**

```bash
git add -A
git commit -m "refactor(home): reorder sections, add works preview, drop video-grid"
```

---

### Task 4: Navbar 混合导航（WORKS 路由 + CONTACT 锚点）

**Files:**
- Modify: `components/navbar.tsx`

- [ ] **Step 1: 导航项模型替换**

将顶部 `const SECTIONS = [...]` 替换为：

```tsx
type NavItem = { label: string; kind: "route" | "anchor"; target: string };

const NAV_ITEMS: NavItem[] = [
  { label: "WORKS", kind: "route", target: "/works" },
  { label: "NEWS", kind: "anchor", target: "news" },
  { label: "ABOUT", kind: "anchor", target: "about" },
  { label: "CONTACT", kind: "anchor", target: "contact" },
];
```

- [ ] **Step 2: 点击处理分流**

现有 `handleSectionClick` 改造为两个函数：

```tsx
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
```

route 项不写专门处理函数：菜单项渲染为普通 `<a href={item.target}>` 且 onClick 只调 `closeMenu()`——不加 preventDefault，让全局 progress-bar 的 capture 监听接管（黑场过渡 + router.push），避免双重跳转。

- [ ] **Step 3: 两处菜单渲染替换**

移动端全屏菜单与桌面右侧面板中的 `{SECTIONS.map(...)}` 都改为：

```tsx
            {NAV_ITEMS.map((item, i) =>
              item.kind === "route" ? (
                <a
                  key={item.label}
                  href={item.target}
                  onClick={closeMenu}
                  className="<原有 className 不变>"
                  style={<原有 style 不变>}
                >
                  {item.label}
                </a>
              ) : (
                <a
                  key={item.label}
                  href={`/#${item.target}`}
                  onClick={(e) => handleAnchorClick(e, item.target)}
                  className="<原有 className 不变>"
                  style={<原有 style 不变>}
                >
                  {item.label}
                </a>
              )
            )}
```

注意两处的 `className`/`style` 各自保留原值（移动端 text-3xl py-2…，桌面端 text-3xl lg:text-4xl py-2…）；「管理」Link 的 `animationDelay` 引用从 `SECTIONS.length` 改为 `NAV_ITEMS.length`（两处）。

- [ ] **Step 4: 类型检查**

Run: `npx tsc --noEmit`
Expected: 无输出

- [ ] **Step 5: 构建验证**

Run: `npx next build 2>&1 | Select-String "Compiled|Failed|error" | Select-Object -First 10`
Expected: 含 `Compiled successfully`

- [ ] **Step 6: 提交**

```bash
git add components/navbar.tsx
git commit -m "feat(navbar): mixed nav model (WORKS route, CONTACT anchor)"
```

---

### Task 5: 端到端验收 + 最终审查 + 推送

**Files:**
- 无（只读验证 + git push）

- [ ] **Step 1: 启动 dev 并逐项核对手动清单**

Run: `npm run dev`，浏览器打开 `http://localhost:3000`：
1. 首访清 sessionStorage 后刷新：logo 淡入 → 整层淡出露出页面；再刷新直接进入（无 logo 层）
2. Hero CTA 与导航 WORKS 均进入 `/works`；黑场过渡正常
3. `/works` 默认沉浸纵向流；点右上按钮切网格+年份筛选可用；再切回正常；showreel 打开正常
4. 沉浸大卡点击进详情：缩略图克隆飞入播放器正常
5. 首页顺序 Hero→about→news→works 预览→footer；导航 NEWS/ABOUT/CONTACT 在首页内平滑滚动定位准确
6. 在 `/works` 或详情页点 NEWS/ABOUT/CONTACT：先黑场回首页再滚动到目标
7. 预览区「查看全部作品」进 `/works`

- [ ] **Step 2: 确认工作树干净后推送**

```bash
git status
git push
```

Expected: `master -> master` 成功
