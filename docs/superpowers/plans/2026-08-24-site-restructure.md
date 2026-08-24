# 绔欑偣閲嶆瀯 Implementation Plan锛圚ero 鍏ュ満绠€鍖?+ /works 鐙珛椤?+ 棣栭〉閲嶇粍锛?
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 棣栧睆鍏ュ満绠€鍖栦负銆宭ogo 娣″叆 鈫?椤甸潰娣″叆銆嶏紱works 鎷嗕负 `/works` 鐙珛椤碉紙榛樿娌夋蹈绾靛悜娴侊紝鍙垏鎹㈢揣鍑戠綉鏍硷級锛涢椤甸噸鎺掍负 Hero鈫抋bout鈫抧ews鈫抴orks棰勮鈫抐ooter锛涘鑸敼娣峰悎妯″瀷骞舵柊澧?CONTACT銆?
**Architecture:** `/works` 涓虹嫭绔?Server Component 椤碉紙window 婊氬姩锛屼笉澶嶇敤棣栭〉 `#main-scroll` lerp 鏈哄埗锛夛紱棣栭〉鍒?VideoGrid 鎹㈣交閲?WorksPreview锛沨ero 鍏ュ満灞傛浛鎹?LoadingScreen/nudge锛沶avbar 浠庣函閿氱偣鏀逛负 route/anchor 娣峰悎椤广€傛棦鏈夋満鍒舵寜闇€淇濈暀锛歭erp 婊氬姩銆乸ending-scroll 鍥炶烦銆佸厠闅嗛鍏ヨ繃娓★紙`data-vt-id`锛夈€侀粦鍦鸿矾鐢辫繃娓°€?
**Tech Stack:** Next.js 16 (App Router/Turbopack)銆乀ailwind v4銆乴ucide-react銆傞獙璇侊細`npx tsc --noEmit` + `npx next build` + 鎵嬪姩娓呭崟锛堥」鐩棤娴嬭瘯妗嗘灦锛夈€?
**璁捐鏂囨。:** `docs/superpowers/specs/2026-08-24-site-restructure-design.md`

---

### Task 1: Hero 鍏ュ満绠€鍖?
**Files:**
- Modify: `components/hero-video.tsx`锛堝ぇ骞呯簿绠€锛?- Delete: `components/loading-screen.tsx`

- [ ] **Step 1: 閲嶅啓 hero-video.tsx**

鏁存枃浠舵浛鎹负锛?
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
      // 瀹瑰櫒浠呭湪 md+ 鏄粴鍔ㄥ厓绱狅紱绉诲姩绔敱 window 婊氬姩
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

  // Logo 鍏ュ満灞傛樉闅愶細pre-loader 榛戝簳鍏滃簳鏈熼棿鐢?React 鎺ョ銆?  // 鍥炶锛坰essionStorage 鏈?hero-loaded锛夌洿鎺ヨ烦杩囥€?  useLayoutEffect(() => {
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

  // 鏃堕棿绾匡細娣″叆 500ms 鈫?鍋滅暀 400ms 鈫?娣″嚭 450ms 鈫?鍗歌浇骞跺啓鍏ュ洖璁挎爣璁?  useEffect(() => {
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
      {/* Logo 鍏ュ満灞?*/}
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
          璺宠浆鑷?works.
          <ArrowRight className="w-3 h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      </section>
    </>
  );
}
```

瑕佺偣锛氬垹闄?LoadingScreen 寮曠敤銆乸layNudge/finishIntro/handleLoadReady/introDoneRef/loadTriggered/nudgeRaf/fadeOut/showLoader/loaderVisible 鍏ㄩ儴鐩稿叧浠ｇ爜锛涜棰戜笉鍐嶉樆濉炲叆鍦恒€?
- [ ] **Step 2: 鍒犻櫎 loading-screen.tsx**

```bash
git rm components/loading-screen.tsx
```

- [ ] **Step 3: 绫诲瀷妫€鏌?*

Run: `npx tsc --noEmit`
Expected: 鏃犺緭鍑恒€傝嫢鎶?loading-screen 鐩稿叧娈嬬暀寮曠敤锛屾鏌ユ槸鍚﹁繕鏈夊叾浠栨枃浠?import 瀹冿紙搴斿彧鏈?hero-video 宸茬Щ闄わ級銆?
- [ ] **Step 4: 鏋勫缓楠岃瘉**

Run: `npx next build 2>&1 | Select-String "Compiled|Failed|error" | Select-Object -First 10`
Expected: 鍚?`Compiled successfully`

- [ ] **Step 5: 鎻愪氦**

```bash
git add components/hero-video.tsx
git commit -m "refactor(hero): simplify intro to logo fade-in then page reveal"
```

---

### Task 2: `/works` 鐙珛椤甸潰锛堟矇娴告祦 + 缃戞牸鍒囨崲锛?
**Files:**
- Create: `components/works-client.tsx`
- Create: `app/works/page.tsx`

- [ ] **Step 1: 鍒涘缓 `components/works-client.tsx`**

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
  const [selectedYear, setSelectedYear] = useState("鍏ㄩ儴");
  const [showShowreel, setShowShowreel] = useState(false);

  const years = useMemo(() => {
    const set = new Set<string>();
    for (const v of videos) {
      if (v.date) set.add(new Date(v.date).getFullYear().toString());
    }
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [videos]);

  const filteredVideos =
    selectedYear === "鍏ㄩ儴"
      ? videos
      : videos.filter((v) => v.date && new Date(v.date).getFullYear().toString() === selectedYear);

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        {/* 鏍囬琛?*/}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight" style={{ fontFamily: "var(--font-bitcount)" }}>
              works.
            </h2>
            <p className="text-base md:text-lg text-neutral-400 font-light mt-1">鍏ㄩ儴瑙嗛浣滃搧涓庡垱浣滈」鐩?/p>
          </div>
          <button
            aria-label={view === "immersive" ? "鍒囨崲鍒扮綉鏍艰鍥? : "鍒囨崲鍒版矇娴歌鍥?}
            onClick={() => setView((v) => (v === "immersive" ? "grid" : "immersive"))}
            className="text-neutral-400 hover:text-white border border-neutral-700 hover:border-neutral-400 p-2.5 transition-colors"
          >
            {view === "immersive" ? <Grid2x2 className="w-5 h-5" /> : <Rows3 className="w-5 h-5" />}
          </button>
        </div>

        {/* Showreel 妯潯 */}
        <div className="mb-10">
          <button
            onClick={() => setShowShowreel(true)}
            className="w-full h-12 bg-neutral-900 hover:bg-neutral-800 transition-colors duration-300 cursor-pointer group flex items-center justify-between px-4 md:px-6"
          >
            <div className="flex items-center gap-3">
              <span className="text-neutral-500 text-sm md:text-base tracking-wider translate-y-px" style={{ fontFamily: "var(--font-bitcount)" }}>REEL</span>
              <span className="text-sm md:text-base text-neutral-400 group-hover:text-white transition-colors duration-300">瑙嗚鍒涗綔鎬荤粨</span>
            </div>
            <PlayGlyph />
          </button>
        </div>

        {/* 瑙嗗浘涓讳綋 */}
        {videos.length === 0 ? (
          <p className="text-neutral-600 text-sm mt-8">鏆傛棤浣滃搧銆?/p>
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

璇存槑锛氭矇娴稿崱鐢ㄥ師鐢?svg 涓夎鑰岄潪 lucide Play锛屼笌鏃фí鏉＄殑 鈻?褰㈡€佷竴鑷翠笖鏇磋交锛沗data-vt-id` 浣胯鎯呴〉鍏嬮殕椋炲叆杩囨浮鐢熸晥銆?
- [ ] **Step 2: 鍒涘缓 `app/works/page.tsx`**

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

- [ ] **Step 3: 绫诲瀷妫€鏌?*

Run: `npx tsc --noEmit`
Expected: 鏃犺緭鍑?
- [ ] **Step 4: 鏋勫缓楠岃瘉**

Run: `npx next build 2>&1 | Select-String "Compiled|Failed|error" | Select-Object -First 10`
Expected: 鍚?`Compiled successfully`锛岃矾鐢辫〃鍑虹幇 `/works`

- [ ] **Step 5: 鎻愪氦**

```bash
git add components/works-client.tsx app/works/page.tsx
git commit -m "feat(works): standalone /works page with immersive/grid views"
```

---

### Task 3: 棣栭〉閲嶇粍锛坅bout 涓婄Щ + works 棰勮 + 娓呯悊锛?
**Files:**
- Create: `components/works-preview.tsx`
- Modify: `components/home-client.tsx`锛堟澘鍧楅『搴忎笌瀵煎叆锛?- Modify: `components/about-section.tsx`锛堣仈绯诲潡鍔?id="contact"锛?- Delete: `components/video-grid.tsx`銆乣components/works-marquee.tsx`
- Modify: `app/globals.css`锛堝垹 marquee/flicker 姝绘牱寮忥級

- [ ] **Step 1: 鍒涘缓 `components/works-preview.tsx`**

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
      <p className="text-base md:text-lg text-neutral-400 font-light mt-1">绮鹃€変綔鍝?路 瀹屾暣鍒楄〃瑙佸叏閮?/p>

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
          鏌ョ湅鍏ㄩ儴浣滃搧
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: home-client.tsx 璋冩暣椤哄簭涓庡鍏?*

瀵煎叆鍖烘妸 `import { VideoGrid } from "@/components/video-grid";` 鏇挎崲涓?`import { WorksPreview } from "@/components/works-preview";`锛涙覆鏌撳尯鏀逛负锛?
```tsx
      <HeroVideo videoUrl={heroVideoUrl} />
      <AboutSection />
      <NewsSection posts={posts} />
      <WorksPreview videos={videos} />
      <Footer />
```

- [ ] **Step 3: about-section.tsx 鑱旂郴鍧楀姞閿氱偣**

灏?`<div className="md:border-l md:border-neutral-800 md:pl-12 flex-shrink-0">` 鏀逛负锛?
```tsx
        <div id="contact" className="md:border-l md:border-neutral-800 md:pl-12 flex-shrink-0">
```

- [ ] **Step 4: 鍒犻櫎搴熷純缁勪欢涓庢鏍峰紡**

```bash
git rm components/video-grid.tsx components/works-marquee.tsx
```

`app/globals.css` 鍒犻櫎浠ヤ笅涓夋锛坢arquee 涓?flicker 宸叉棤娑堣垂鑰咃紱works-expand/collapse 淇濈暀缁?/works 鐢級锛?- `@keyframes marquee { ... }`銆乣.animate-marquee { ... }`銆乣.marquee-container:hover .animate-marquee { ... }`
- `@keyframes flicker-in { ... }`

- [ ] **Step 5: 绫诲瀷妫€鏌?*

Run: `npx tsc --noEmit`
Expected: 鏃犺緭鍑猴紙鑻ユ姤 ShowreelModal/video-card 鏈敤瀵煎嚭璀﹀憡鍙拷鐣モ€斺€斿畠浠 /works 浣跨敤锛?
- [ ] **Step 6: 鏋勫缓楠岃瘉**

Run: `npx next build 2>&1 | Select-String "Compiled|Failed|error" | Select-Object -First 10`
Expected: 鍚?`Compiled successfully`

- [ ] **Step 7: 鎻愪氦**

```bash
git add -A
git commit -m "refactor(home): reorder sections, add works preview, drop video-grid"
```

---

### Task 4: Navbar 娣峰悎瀵艰埅锛圵ORKS 璺敱 + CONTACT 閿氱偣锛?
**Files:**
- Modify: `components/navbar.tsx`

- [ ] **Step 1: 瀵艰埅椤规ā鍨嬫浛鎹?*

灏嗛《閮?`const SECTIONS = [...]` 鏇挎崲涓猴細

```tsx
type NavItem = { label: string; kind: "route" | "anchor"; target: string };

const NAV_ITEMS: NavItem[] = [
  { label: "WORKS", kind: "route", target: "/works" },
  { label: "NEWS", kind: "anchor", target: "news" },
  { label: "ABOUT", kind: "anchor", target: "about" },
  { label: "CONTACT", kind: "anchor", target: "contact" },
];
```

- [ ] **Step 2: 鐐瑰嚮澶勭悊鍒嗘祦**

鐜版湁 `handleSectionClick` 鏀归€犱负涓や釜鍑芥暟锛?
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

route 椤逛笉鍐欎笓闂ㄥ鐞嗗嚱鏁帮細鑿滃崟椤规覆鏌撲负鏅€?`<a href={item.target}>` 涓?onClick 鍙皟 `closeMenu()`鈥斺€斾笉鍔?preventDefault锛岃鍏ㄥ眬 progress-bar 鐨?capture 鐩戝惉鎺ョ锛堥粦鍦鸿繃娓?+ router.push锛夛紝閬垮厤鍙岄噸璺宠浆銆?
- [ ] **Step 3: 涓ゅ鑿滃崟娓叉煋鏇挎崲**

绉诲姩绔叏灞忚彍鍗曚笌妗岄潰鍙充晶闈㈡澘涓殑 `{SECTIONS.map(...)}` 閮芥敼涓猴細

```tsx
            {NAV_ITEMS.map((item, i) =>
              item.kind === "route" ? (
                <a
                  key={item.label}
                  href={item.target}
                  onClick={closeMenu}
                  className="<鍘熸湁 className 涓嶅彉>"
                  style={<鍘熸湁 style 涓嶅彉>}
                >
                  {item.label}
                </a>
              ) : (
                <a
                  key={item.label}
                  href={`/#${item.target}`}
                  onClick={(e) => handleAnchorClick(e, item.target)}
                  className="<鍘熸湁 className 涓嶅彉>"
                  style={<鍘熸湁 style 涓嶅彉>}
                >
                  {item.label}
                </a>
              )
            )}
```

娉ㄦ剰涓ゅ鐨?`className`/`style` 鍚勮嚜淇濈暀鍘熷€硷紙绉诲姩绔?text-3xl py-2鈥︼紝妗岄潰绔?text-3xl lg:text-4xl py-2鈥︼級锛涖€岀鐞嗐€峀ink 鐨?`animationDelay` 寮曠敤浠?`SECTIONS.length` 鏀逛负 `NAV_ITEMS.length`锛堜袱澶勶級銆?
- [ ] **Step 4: 绫诲瀷妫€鏌?*

Run: `npx tsc --noEmit`
Expected: 鏃犺緭鍑?
- [ ] **Step 5: 鏋勫缓楠岃瘉**

Run: `npx next build 2>&1 | Select-String "Compiled|Failed|error" | Select-Object -First 10`
Expected: 鍚?`Compiled successfully`

- [ ] **Step 6: 鎻愪氦**

```bash
git add components/navbar.tsx
git commit -m "feat(navbar): mixed nav model (WORKS route, CONTACT anchor)"
```

---

### Task 5: 绔埌绔獙鏀?+ 鏈€缁堝鏌?+ 鎺ㄩ€?
**Files:**
- 鏃狅紙鍙楠岃瘉 + git push锛?
- [ ] **Step 1: 鍚姩 dev 骞堕€愰」鏍稿鎵嬪姩娓呭崟**

Run: `npm run dev`锛屾祻瑙堝櫒鎵撳紑 `http://localhost:3000`锛?1. 棣栬娓?sessionStorage 鍚庡埛鏂帮細logo 娣″叆 鈫?鏁村眰娣″嚭闇插嚭椤甸潰锛涘啀鍒锋柊鐩存帴杩涘叆锛堟棤 logo 灞傦級
2. Hero CTA 涓庡鑸?WORKS 鍧囪繘鍏?`/works`锛涢粦鍦鸿繃娓℃甯?3. `/works` 榛樿娌夋蹈绾靛悜娴侊紱鐐瑰彸涓婃寜閽垏缃戞牸+骞翠唤绛涢€夊彲鐢紱鍐嶅垏鍥炴甯革紱showreel 鎵撳紑姝ｅ父
4. 娌夋蹈澶у崱鐐瑰嚮杩涜鎯咃細缂╃暐鍥惧厠闅嗛鍏ユ挱鏀惧櫒姝ｅ父
5. 棣栭〉椤哄簭 Hero鈫抋bout鈫抧ews鈫抴orks 棰勮鈫抐ooter锛涘鑸?NEWS/ABOUT/CONTACT 鍦ㄩ椤靛唴骞虫粦婊氬姩瀹氫綅鍑嗙‘
6. 鍦?`/works` 鎴栬鎯呴〉鐐?NEWS/ABOUT/CONTACT锛氬厛榛戝満鍥為椤靛啀婊氬姩鍒扮洰鏍?7. 棰勮鍖恒€屾煡鐪嬪叏閮ㄤ綔鍝併€嶈繘 `/works`

- [ ] **Step 2: 纭宸ヤ綔鏍戝共鍑€鍚庢帹閫?*

```bash
git status
git push
```

Expected: `master -> master` 鎴愬姛
