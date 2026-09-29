# 首页与 Works 页统一改版 + 动效 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让首页与 `/works` 共用章节标题、作品卡片、列表行和桌面导航，并加入 8 个克制的动效（第 9 个转场沿用现状）。

**Architecture:** 新增共用组件 `SectionHeading`（标题解码 + 副标题擦出）与 `WorkCard`（缩略图在上、文字在下），纯逻辑放在 `lib/scramble-text.ts`、`lib/hero-intro.ts`、`lib/works-index.ts`、`lib/portfolio-navigation.ts` 以便单测。所有运动由 `app/globals.css` 的数据属性 / 类选择器驱动；隐藏态只在浏览器中添加，SSR 与无 JS 时内容始终可见；`prefers-reduced-motion: reduce` 下全部关闭。

**Tech Stack:** Next.js 16.2 App Router、React 19、TypeScript、Tailwind CSS 4、Node 内置 test runner（`tsx --test`）+ `renderToStaticMarkup`。

**Spec:** `docs/superpowers/specs/2026-09-29-home-works-refresh-design.md`

## Global Constraints

- 只用黑白灰，不加强调色；字体不变（Inter 正文、Montserrat 仅 Hero 名字、Bitcount 用 `var(--font-bitcount)` 做章节标题与 logo）。
- 固定中文文案保持现有字符串：「精选视频作品与创作项目」「最新动态」「了解更多 & 合作洽谈」「视觉创作总结」「跳转至 works.」；作品内容不翻译。
- 首页作品卡片链接必须带 `?from=home`；作品缩略图容器必须带 `data-vt-id={work.id}` 且内含 `<img>`（`components/progress-bar.tsx:140` 依赖它做飞入转场）。
- 桌面端首页在 `#main-scroll` 内滚动，手机端是 window 滚动；滚动相关逻辑两种都要处理。
- 所有新动效在 `@media (prefers-reduced-motion: reduce)` 下关闭且内容可见；悬停效果只在 `md` 及以上或 `(hover: hover)` 下生效。
- 不改数据库、API、后台、鉴权；不改作品详情页、News 详情页、页脚、`ProgressBar` 转场。
- 不运行 `npm run build`（会执行 `prisma migrate deploy`）。只提交本次相关文件，不用 `git add -A`；`HANDOFF.md` 目前未被跟踪，只更新不提交。
- Next.js 16 有破坏性变更：写 Next API 前先看 `node_modules/next/dist/docs/` 相关页面。

## Review Focus

- **减少动态效果**：开启系统「减少动态效果」后，Hero 名字、章节标题、副标题、卡片、进度线、呼吸环都应静止且完整可见 —— Task 2、3、4、5、7 各有 CSS 回退测试。
- **无 JS / SSR 首屏**：服务端输出里标题、Hero 名字、卡片都必须是完整可见的文字，不能带 `pending` 隐藏态 —— Task 2、3、7 的 SSR 测试。
- **作品很少或没有**：首页 0 个作品时显示「作品正在更新中。」而不是空网格；少于 4 个时不出现被隐藏的卡片；首页缺少某个板块时导航下划线不报错 —— Task 4、8 测试。
- **触屏设备**：点按卡片或列表行后悬停效果不能「粘住」—— Task 3（`md:group-hover`）与 Task 5（`@media (hover: none)`）测试。
- **Works 页切换中英文**：切换后副标题变成对应语言，章节标题 `selected.` / `archive.` 不变、不被重新隐藏 —— Task 6 测试。

---

### Task 1: 标题解码的纯逻辑

**Files:**
- Create: `lib/scramble-text.ts`
- Test: `tests/scramble-text.test.ts`

**Interfaces:**
- Produces: `SCRAMBLE_STEP_MS = 70`、`SCRAMBLE_SETTLE_MS = 350`、`SUBTITLE_WIPE_MS = 480`、`SCRAMBLE_GLYPHS: string`、`getScrambleFrame(text: string, elapsedMs: number, random?: () => number): string`、`getScrambleDurationMs(text: string): number`、`getSubtitleDelayMs(text: string): number`

- [ ] **Step 1: 建分支并提交设计文档**

```bash
git switch -c feat/home-works-refresh
git add docs/superpowers/specs/2026-09-29-home-works-refresh-design.md docs/superpowers/plans/2026-09-29-home-works-refresh.md
git commit -m "docs: plan home and works page refresh"
```

- [ ] **Step 2: 写失败的测试**

`tests/scramble-text.test.ts`：

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  SCRAMBLE_GLYPHS,
  SCRAMBLE_SETTLE_MS,
  SCRAMBLE_STEP_MS,
  getScrambleDurationMs,
  getScrambleFrame,
  getSubtitleDelayMs,
} from "../lib/scramble-text";

const first = () => 0;

test("characters appear one by one on the 70ms step", () => {
  assert.equal(SCRAMBLE_STEP_MS, 70);
  assert.equal(getScrambleFrame("works.", 0, first).length, 1);
  assert.equal(getScrambleFrame("works.", SCRAMBLE_STEP_MS * 2, first).length, 3);
});

test("each character shows a glyph until it settles 350ms after appearing", () => {
  assert.equal(SCRAMBLE_SETTLE_MS, 350);
  assert.equal(getScrambleFrame("works.", 0, first), SCRAMBLE_GLYPHS[0]);
  assert.equal(getScrambleFrame("works.", SCRAMBLE_SETTLE_MS, first)[0], "w");
});

test("the full title is shown once the last character settles", () => {
  assert.equal(getScrambleDurationMs("works."), 5 * 70 + 350);
  assert.equal(getScrambleFrame("works.", getScrambleDurationMs("works."), first), "works.");
});

test("subtitle starts halfway through the title", () => {
  assert.equal(getSubtitleDelayMs("works."), 3 * 70 + 60);
  assert.equal(getSubtitleDelayMs("selected."), 4 * 70 + 60);
});

test("handles empty, CJK and spaced titles", () => {
  assert.equal(getScrambleFrame("", 1000, first), "");
  assert.equal(getScrambleDurationMs(""), 0);
  assert.equal(getScrambleFrame("全部 作品", 10_000, first), "全部 作品");
  // 空格不参与乱码
  assert.equal(getScrambleFrame("a b", 2 * 70, first)[1], " ");
});

test("an out-of-range random value never yields an undefined glyph", () => {
  assert.equal(getScrambleFrame("ab", 0, () => 1), SCRAMBLE_GLYPHS[SCRAMBLE_GLYPHS.length - 1]);
});
```

- [ ] **Step 3: 运行，确认失败**

Run: `npx tsx --test tests/scramble-text.test.ts`
Expected: FAIL，提示找不到 `../lib/scramble-text`

- [ ] **Step 4: 实现**

`lib/scramble-text.ts`：

```ts
// 章节标题「解码」动画的纯逻辑：逐字出现，每个字先以乱码现身，
// 定格后显示原字；副标题在标题出到一半时开始擦出。
// 时间参数与 Design 画布「动效方案」第 2 项一致。

export const SCRAMBLE_STEP_MS = 70;
export const SCRAMBLE_SETTLE_MS = 350;
export const SUBTITLE_WIPE_MS = 480;
export const SCRAMBLE_GLYPHS = "#%&*+=?/<>[]{}01";

export function getScrambleFrame(
  text: string,
  elapsedMs: number,
  random: () => number = Math.random
): string {
  const chars = Array.from(text);
  let out = "";
  for (let i = 0; i < chars.length; i++) {
    const start = i * SCRAMBLE_STEP_MS;
    if (elapsedMs < start) break;
    if (chars[i] === " " || elapsedMs >= start + SCRAMBLE_SETTLE_MS) {
      out += chars[i];
      continue;
    }
    const index = Math.min(
      SCRAMBLE_GLYPHS.length - 1,
      Math.floor(random() * SCRAMBLE_GLYPHS.length)
    );
    out += SCRAMBLE_GLYPHS[index];
  }
  return out;
}

export function getScrambleDurationMs(text: string): number {
  const length = Array.from(text).length;
  return length === 0 ? 0 : (length - 1) * SCRAMBLE_STEP_MS + SCRAMBLE_SETTLE_MS;
}

export function getSubtitleDelayMs(text: string): number {
  return Math.floor(Array.from(text).length / 2) * SCRAMBLE_STEP_MS + 60;
}
```

- [ ] **Step 5: 运行，确认通过**

Run: `npx tsx --test tests/scramble-text.test.ts`
Expected: PASS（6 个测试）

- [ ] **Step 6: 提交**

```bash
git add lib/scramble-text.ts tests/scramble-text.test.ts
git commit -m "feat(motion): add section title scramble timing"
```

---

### Task 2: 共用章节标题 `SectionHeading`

**Files:**
- Create: `components/section-heading.tsx`
- Modify: `app/globals.css`（在 `/* reduced-motion：不播放动画 ... */` 那段 `@media` 之前追加）
- Test: `tests/section-heading.test.ts`

**Interfaces:**
- Consumes: Task 1 的 `getScrambleFrame`、`getScrambleDurationMs`、`getSubtitleDelayMs`
- Produces: `SectionHeading({ title: string; subtitle?: string; id?: string; className?: string; subtitleRef?: (el: HTMLElement | null) => void })`；根元素带 `data-section-heading="static" | "pending" | "play"`；副标题类名 `section-heading-sub`

- [ ] **Step 1: 写失败的测试**

`tests/section-heading.test.ts`：

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SectionHeading } from "../components/section-heading";

test("SSR renders the full title and subtitle without a hidden state", () => {
  const markup = renderToStaticMarkup(
    createElement(SectionHeading, { title: "works.", subtitle: "精选视频作品与创作项目" })
  );
  assert.match(markup, /data-section-heading="static"/);
  assert.match(markup, /aria-label="works\."/);
  assert.match(markup, />works\.</);
  assert.match(markup, /精选视频作品与创作项目/);
  assert.match(markup, /--sub-delay:270ms/);
  assert.match(markup, /var\(--font-bitcount\)/);
  assert.doesNotMatch(markup, /pending/);
});

test("heading id is forwarded for aria-labelledby", () => {
  const markup = renderToStaticMarkup(
    createElement(SectionHeading, { id: "selected-works-heading", title: "selected." })
  );
  assert.match(markup, /<h2 id="selected-works-heading"/);
});

test("subtitle is optional", () => {
  const markup = renderToStaticMarkup(createElement(SectionHeading, { title: "about." }));
  assert.doesNotMatch(markup, /section-heading-sub/);
});

test("CSS wipes the subtitle horizontally only and respects reduced motion", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const start = css.indexOf("/* SectionHeading");
  const end = css.indexOf("/* end SectionHeading */");
  assert.ok(start >= 0 && end > start, "SectionHeading block exists");
  const block = css.slice(start, end);
  assert.match(block, /translateX\(-16px\)/);
  assert.doesNotMatch(block, /translateY/);
  assert.match(block, /clip-path: inset\(0 100% 0 0\)/);
  assert.match(block, /480ms/);
  assert.match(block, /prefers-reduced-motion: reduce/);
});
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx tsx --test tests/section-heading.test.ts`
Expected: FAIL，找不到 `../components/section-heading`

- [ ] **Step 3: 实现组件**

`components/section-heading.tsx`：

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  getScrambleDurationMs,
  getScrambleFrame,
  getSubtitleDelayMs,
} from "@/lib/scramble-text";

type HeadingPhase = "static" | "pending" | "play";

// 两页共用的章节标题：Bitcount 小写标题 + 浅灰副标题。
// 进入视口时标题逐字「解码」、副标题从左擦出，只播一次。
// SSR 与无 JS 时输出完整文字；隐藏态只在浏览器中、且未开启减少动态效果时添加。
export function SectionHeading({
  title,
  subtitle,
  id,
  className,
  subtitleRef,
}: {
  title: string;
  subtitle?: string;
  id?: string;
  className?: string;
  subtitleRef?: (el: HTMLElement | null) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<HeadingPhase>("static");
  const [display, setDisplay] = useState(title);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let observer: IntersectionObserver | null = null;
    const total = getScrambleDurationMs(title);

    function play() {
      setPhase("play");
      const start = performance.now();
      const tick = (now: number) => {
        const elapsed = now - start;
        if (elapsed >= total) {
          setDisplay(title);
          frame = 0;
          return;
        }
        setDisplay(getScrambleFrame(title, elapsed));
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }

    // 与 Reveal 一致：先提交隐藏态这一帧，再开始观察，副标题过渡才会播放
    frame = requestAnimationFrame(() => {
      setPhase("pending");
      setDisplay("");
      frame = requestAnimationFrame(() => {
        observer = new IntersectionObserver(
          (entries) => {
            if (!entries.some((entry) => entry.isIntersecting)) return;
            observer?.disconnect();
            observer = null;
            play();
          },
          { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
        );
        observer.observe(el);
      });
    });

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [title]);

  return (
    <div ref={rootRef} data-section-heading={phase} className={className}>
      <h2
        id={id}
        aria-label={title}
        className="text-4xl font-normal tracking-tight md:text-5xl lg:text-6xl"
        style={{ fontFamily: "var(--font-bitcount)" }}
      >
        {/* 占位空格保持行高，避免隐藏态时标题塌陷造成跳动 */}
        <span aria-hidden="true">{display || " "}</span>
      </h2>
      {subtitle && (
        <p
          ref={subtitleRef}
          className="section-heading-sub mt-1 text-base font-light text-neutral-400 md:text-lg"
          style={{ "--sub-delay": `${getSubtitleDelayMs(title)}ms` } as CSSProperties}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 加 CSS**

在 `app/globals.css` 中 `/* reduced-motion：不播放动画，内容立即可见（JS 早退之外的双保险） */` 这一行**之前**插入：

```css
/* SectionHeading：标题逐字解码由 JS 驱动；副标题只做水平擦出，
   时长与延迟见 lib/scramble-text.ts（SUBTITLE_WIPE_MS / getSubtitleDelayMs） */
[data-section-heading] .section-heading-sub {
  transition:
    opacity 480ms var(--ease-menu) var(--sub-delay, 0ms),
    transform 480ms var(--ease-menu) var(--sub-delay, 0ms),
    clip-path 480ms var(--ease-menu) var(--sub-delay, 0ms);
}
[data-section-heading="pending"] .section-heading-sub {
  opacity: 0;
  transform: translateX(-16px);
  clip-path: inset(0 100% 0 0);
}
@media (prefers-reduced-motion: reduce) {
  [data-section-heading] .section-heading-sub {
    transition: none !important;
    opacity: 1 !important;
    transform: none !important;
    clip-path: none !important;
  }
}
/* end SectionHeading */
```

- [ ] **Step 5: 运行，确认通过**

Run: `npx tsx --test tests/section-heading.test.ts`
Expected: PASS（4 个测试）

- [ ] **Step 6: 提交**

```bash
git add components/section-heading.tsx app/globals.css tests/section-heading.test.ts
git commit -m "feat(motion): add shared scrambling section heading"
```

---

### Task 3: 共用作品卡片 `WorkCard` 与卡片揭示

**Files:**
- Create: `components/work-card.tsx`
- Modify: `lib/works-index.ts`（文件末尾追加两个函数）
- Modify: `components/viewport-reveal.tsx:7`（`RevealVariant` 加 `"card"`）
- Modify: `app/globals.css`（卡片揭示规则 + reduced-motion 块补 `clip-path`）
- Test: `tests/work-card.test.ts`

**Interfaces:**
- Produces:
  - `getWorkYear(date: string | null): string | null`
  - `formatWorkMeta(parts: Array<string | null | undefined>): string`
  - `WorkCard({ work: VideoRow; href: string; meta: string; sizes: string; ariaLabel?: string; summary?: string | null; details?: string | null; size?: "default" | "large" })`
  - `Reveal` 支持 `variant="card"`，输出 `data-reveal="card"`

- [ ] **Step 1: 写失败的测试**

`tests/work-card.test.ts`：

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { WorkCard } from "../components/work-card";
import { Reveal } from "../components/viewport-reveal";
import { formatWorkMeta, getWorkYear } from "../lib/works-index";
import type { VideoRow } from "../lib/types";

const base: VideoRow = {
  id: "w1",
  title: "Night Drive",
  description: null,
  summary: null,
  role: null,
  tools: null,
  category: "PV",
  embedUrl: "",
  thumbnail: null,
  featured: false,
  order: 0,
  date: "2026-03-01T00:00:00.000Z",
};

test("work meta joins non-empty parts with a middle dot", () => {
  assert.equal(formatWorkMeta(["PV", "2026", null, "  ", undefined]), "PV · 2026");
  assert.equal(formatWorkMeta([]), "");
});

test("work year uses UTC and ignores missing or invalid dates", () => {
  assert.equal(getWorkYear("2026-01-01T00:00:00.000Z"), "2026");
  assert.equal(getWorkYear(null), null);
  assert.equal(getWorkYear("not a date"), null);
});

test("card renders the thumbnail first, then title, meta, details and summary", () => {
  const markup = renderToStaticMarkup(
    createElement(WorkCard, {
      work: base,
      href: "/works/w1?from=home",
      meta: "PV · 2026",
      details: "Role Motion Design",
      summary: "One line summary",
      sizes: "100vw",
    })
  );
  assert.match(markup, /href="\/works\/w1\?from=home"/);
  assert.match(markup, /data-vt-id="w1"/);
  assert.ok(markup.indexOf('data-vt-id="w1"') < markup.indexOf("<h3"));
  assert.match(markup, /Night Drive/);
  assert.match(markup, /PV · 2026/);
  assert.match(markup, /Role Motion Design/);
  assert.match(markup, /One line summary/);
});

test("card without a thumbnail shows a neutral play placeholder", () => {
  const markup = renderToStaticMarkup(
    createElement(WorkCard, { work: base, href: "/works/w1", meta: "", sizes: "100vw" })
  );
  assert.match(markup, /lucide-play/);
  assert.doesNotMatch(markup, /<img\b/);
});

test("blob thumbnails go through the same-origin proxy", () => {
  const markup = renderToStaticMarkup(
    createElement(WorkCard, {
      work: { ...base, thumbnail: "https://kq4mwotlyfyzycmp.public.blob.vercel-storage.com/a.jpg" },
      href: "/works/w1",
      meta: "",
      sizes: "100vw",
    })
  );
  assert.match(markup, /\/media\/thumbnail\?url=/);
});

test("hover effects only apply from md and respect reduced motion", () => {
  const markup = renderToStaticMarkup(
    createElement(WorkCard, { work: base, href: "/works/w1", meta: "", sizes: "100vw" })
  );
  assert.match(markup, /▶ PLAY/);
  assert.match(markup, /md:group-hover:opacity-0/);
  assert.match(markup, /md:group-hover:scale-x-100/);
  assert.match(markup, /motion-reduce:transition-none/);
  assert.doesNotMatch(markup, /(?<!md:)group-hover:/);
});

test("card reveal is SSR-visible and has a reduced-motion fallback", () => {
  const markup = renderToStaticMarkup(createElement(Reveal, { variant: "card", delay: 100 }, "card"));
  assert.match(markup, /data-reveal="card"/);
  assert.match(markup, /--reveal-delay:100ms/);
  assert.doesNotMatch(markup, /data-reveal-pending/);

  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\[data-reveal-pending\]\[data-reveal="card"\] \{[^}]*clip-path: inset\(100% 0 0 0\)/);
  assert.match(css, /\[data-reveal-pending\] \{[^}]*clip-path: none !important/);
});
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx tsx --test tests/work-card.test.ts`
Expected: FAIL，找不到 `../components/work-card`

- [ ] **Step 3: 在 `lib/works-index.ts` 末尾追加辅助函数**

```ts
export function getWorkYear(date: string | null): string | null {
  if (!date) return null;
  const year = new Date(date).getUTCFullYear();
  return Number.isNaN(year) ? null : String(year);
}

export function formatWorkMeta(parts: Array<string | null | undefined>): string {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(" · ");
}
```

- [ ] **Step 4: 实现 `components/work-card.tsx`**

```tsx
import Image from "next/image";
import { Play } from "lucide-react";
import { IntentPrefetchLink } from "@/components/intent-prefetch-link";
import { createThumbnailProxyPath } from "@/lib/works-index";
import type { VideoRow } from "@/lib/types";

interface WorkCardProps {
  work: VideoRow;
  href: string;
  meta: string;
  sizes: string;
  ariaLabel?: string;
  summary?: string | null;
  details?: string | null;
  size?: "default" | "large";
}

// 首页与 /works 共用的作品卡片：缩略图在上、文字在下，不叠字。
// 缩略图容器保留 data-vt-id，ProgressBar 的缩略图飞入转场依赖它。
// 悬停效果只在 md 及以上生效，避免触屏点按后「粘住」。
export function WorkCard({
  work,
  href,
  meta,
  sizes,
  ariaLabel,
  summary,
  details,
  size = "default",
}: WorkCardProps) {
  const thumbnail = work.thumbnail
    ? createThumbnailProxyPath(work.thumbnail) ?? work.thumbnail
    : null;

  return (
    <IntentPrefetchLink
      href={href}
      aria-label={ariaLabel}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      <div data-vt-id={work.id} className="relative aspect-video overflow-hidden bg-neutral-900">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={work.title}
            fill
            unoptimized={thumbnail.startsWith("/media/thumbnail")}
            sizes={sizes}
            className="object-cover transition-transform duration-700 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none md:group-hover:scale-105 md:group-focus-visible:scale-105"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center">
            <Play aria-hidden="true" className="h-10 w-10 text-neutral-600" />
          </span>
        )}
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-black/30 transition-opacity duration-300 motion-reduce:transition-none md:group-hover:opacity-0 md:group-focus-visible:opacity-0"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 flex translate-y-2 items-center justify-center text-xs tracking-[0.2em] text-white opacity-0 transition-[opacity,transform] duration-300 motion-reduce:transition-none md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-focus-visible:translate-y-0 md:group-focus-visible:opacity-100"
        >
          ▶ PLAY
        </span>
      </div>
      <div className="mt-3.5">
        <h3 className={size === "large" ? "text-lg md:text-xl" : "text-base"}>
          <span className="relative">
            {work.title}
            <span
              aria-hidden="true"
              className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-white transition-transform duration-[450ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none md:group-hover:scale-x-100 md:group-focus-visible:scale-x-100"
            />
          </span>
        </h3>
        {meta && <p className="mt-1 text-[13px] text-neutral-400">{meta}</p>}
        {details && <p className="mt-1 text-[13px] text-neutral-400">{details}</p>}
        {summary && <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-400">{summary}</p>}
      </div>
    </IntentPrefetchLink>
  );
}
```

- [ ] **Step 5: `Reveal` 支持 `card`**

`components/viewport-reveal.tsx` 第 7 行：

```ts
export type RevealVariant = "heading" | "content" | "dim" | "card";
```

- [ ] **Step 6: 加卡片揭示 CSS**

在 `app/globals.css` 的 `/* 区块遮光层：...` 注释之前插入：

```css
/* 作品卡片依次揭示：自下而上擦出并上移 24px，同排错峰由 --reveal-delay 控制。
   可见态留 12px 外扩，避免裁掉链接的 focus ring */
[data-reveal="card"] {
  clip-path: inset(-12px);
  transition:
    opacity 700ms var(--ease-menu) var(--reveal-delay, 0ms),
    transform 700ms var(--ease-menu) var(--reveal-delay, 0ms),
    clip-path 700ms var(--ease-menu) var(--reveal-delay, 0ms);
}
[data-reveal-pending][data-reveal="card"] {
  opacity: 0;
  transform: translateY(24px);
  clip-path: inset(100% 0 0 0);
}
```

并把文件末尾 reduced-motion 块中的

```css
  [data-reveal-pending] {
    opacity: 1 !important;
    transform: none !important;
  }
```

改为

```css
  [data-reveal-pending] {
    opacity: 1 !important;
    transform: none !important;
    clip-path: none !important;
  }
```

- [ ] **Step 7: 运行，确认通过**

Run: `npx tsx --test tests/work-card.test.ts tests/viewport-reveal.test.ts`
Expected: PASS

- [ ] **Step 8: 提交**

```bash
git add components/work-card.tsx lib/works-index.ts components/viewport-reveal.tsx app/globals.css tests/work-card.test.ts
git commit -m "feat(works): add shared work card with staggered reveal"
```

---

### Task 4: 首页作品区改为网格 + REEL 呼吸环

**Files:**
- Modify: `components/video-grid.tsx`（整体重写）
- Modify: `lib/works-index.ts`（追加 `HOME_WORKS_LIMIT`、`selectHomeWorks`）
- Modify: `app/globals.css`（删除 marquee / works-expand / works-collapse 规则，新增 `.pulse-ring`）
- Delete: `components/works-marquee.tsx`、`components/works-drift.tsx`、`components/category-filter.tsx`、`tests/works-drift.test.ts`
- Modify: `tests/viewport-reveal.test.ts:76-91`
- Test: `tests/home-works.test.ts`

**Interfaces:**
- Consumes: Task 2 `SectionHeading`；Task 3 `WorkCard`、`Reveal variant="card"`、`getWorkYear`、`formatWorkMeta`
- Produces: `HOME_WORKS_LIMIT = 6`、`selectHomeWorks(videos: VideoRow[]): VideoRow[]`；CSS 类 `.pulse-ring`（Task 6 复用）

- [ ] **Step 1: 写失败的测试**

`tests/home-works.test.ts`：

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { VideoGrid } from "../components/video-grid";
import { HOME_WORKS_LIMIT, selectHomeWorks } from "../lib/works-index";
import type { VideoRow } from "../lib/types";

function video(id: string): VideoRow {
  return {
    id,
    title: `Work ${id}`,
    description: null,
    summary: null,
    role: null,
    tools: null,
    category: "PV",
    embedUrl: "",
    thumbnail: null,
    featured: false,
    order: 0,
    date: "2025-06-01T00:00:00.000Z",
  };
}

test("home shows at most six works in admin order", () => {
  const videos = Array.from({ length: 8 }, (_, i) => video(`v${i}`));
  assert.equal(HOME_WORKS_LIMIT, 6);
  assert.deepEqual(selectHomeWorks(videos).map((v) => v.id), ["v0", "v1", "v2", "v3", "v4", "v5"]);
  assert.deepEqual(selectHomeWorks([video("a")]).map((v) => v.id), ["a"]);
});

test("home works grid staggers card reveals by column and hides the 4th+ card on phones", () => {
  const markup = renderToStaticMarkup(
    createElement(VideoGrid, { videos: Array.from({ length: 4 }, (_, i) => video(`v${i}`)) })
  );
  assert.equal(markup.match(/data-reveal="card"/g)?.length, 4);
  assert.match(markup, /--reveal-delay:100ms/);
  assert.match(markup, /--reveal-delay:200ms/);
  assert.equal(markup.match(/hidden sm:block/g)?.length, 1);
  assert.match(markup, /href="\/works\/v0\?from=home"/);
  assert.match(markup, /PV · 2025/);
  assert.match(markup, /lg:grid-cols-3/);
  assert.doesNotMatch(markup, /animate-marquee/);
  assert.doesNotMatch(markup, /显示全部作品/);
});

test("fewer than four works never hides a card", () => {
  const markup = renderToStaticMarkup(
    createElement(VideoGrid, { videos: [video("a"), video("b")] })
  );
  assert.doesNotMatch(markup, /hidden sm:block/);
});

test("home works section shows a message instead of an empty grid", () => {
  const markup = renderToStaticMarkup(createElement(VideoGrid, { videos: [] }));
  assert.match(markup, /作品正在更新中。/);
  assert.doesNotMatch(markup, /data-reveal="card"/);
  assert.match(markup, /ALL WORKS/);
});

test("REEL strip keeps the showreel entry with a breathing ring", () => {
  const markup = renderToStaticMarkup(createElement(VideoGrid, { videos: [video("a")] }));
  assert.match(markup, /REEL/);
  assert.match(markup, /视觉创作总结/);
  assert.match(markup, /pulse-ring/);
});

test("breathing ring CSS respects reduced motion and marquee styles are gone", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /@keyframes pulse-ring/);
  assert.match(css, /\.pulse-ring::before,\s*\.pulse-ring::after \{[^}]*animation: none/);
  assert.doesNotMatch(css, /animate-marquee/);
  assert.doesNotMatch(css, /works-expand/);
});
```

把 `tests/viewport-reveal.test.ts` 中 `"works section stages the title reveal before staggered content"` 整个测试替换为：

```ts
test("works section stages the title reveal before staggered content", () => {
  const markup = renderToStaticMarkup(
    createElement(VideoGrid, { videos: [sampleVideo] })
  );

  assert.match(markup, /data-section-heading="static"/);
  assert.match(markup, /data-reveal="content"/);
  assert.match(markup, /data-reveal="card"/);
  // 错峰：内容相对标题的延迟存在
  assert.match(markup, /--reveal-delay:(1[5-9]\d|[2-9]\d\d)ms/);
  // 无 JS 安全：SSR 不带隐藏态
  assert.ok(!markup.includes("data-reveal-pending"));
  assert.match(markup, /ALL WORKS/);
  assert.match(markup, /href="\/works"/);
  assert.match(markup, /works\./);
  assert.match(markup, /精选视频作品与创作项目/);
});
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx tsx --test tests/home-works.test.ts tests/viewport-reveal.test.ts`
Expected: FAIL（`selectHomeWorks` 不存在，且 markup 仍含 marquee）

- [ ] **Step 3: 在 `lib/works-index.ts` 追加**

```ts
// 首页作品区：按后台顺序取前 6 个；手机端只显示前 3 个（由组件用 CSS 隐藏）
export const HOME_WORKS_LIMIT = 6;

export function selectHomeWorks(videos: VideoRow[]): VideoRow[] {
  return videos.slice(0, HOME_WORKS_LIMIT);
}
```

- [ ] **Step 4: 重写 `components/video-grid.tsx`**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { WorkCard } from "./work-card";
import { ShowreelModal } from "./showreel-modal";
import { Reveal, SectionDim } from "./viewport-reveal";
import { SectionHeading } from "./section-heading";
import { formatWorkMeta, getWorkYear, selectHomeWorks } from "@/lib/works-index";
import type { VideoRow } from "@/lib/types";

// 首页 works. 区：整齐网格（桌面 3 列 / 平板 2 列 / 手机 1 列），
// 手机只显示前 3 个，全部作品去 /works 看。
export function VideoGrid({ videos }: { videos: VideoRow[] }) {
  const [showShowreel, setShowShowreel] = useState(false);
  const works = selectHomeWorks(videos);

  return (
    <section id="works" className="relative w-full bg-[#0a0a0a]">
      <SectionDim />
      <div className="px-6 pt-16 md:px-12 lg:px-16">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <SectionHeading title="works." subtitle="精选视频作品与创作项目" />
          <Reveal variant="content" delay={320} className="self-start md:self-auto">
            <Link
              href="/works"
              className="group inline-flex min-h-11 items-center gap-2 border border-neutral-400 px-5 py-2.5 text-xs tracking-widest text-neutral-300 transition-all duration-300 hover:border-white hover:text-white md:text-sm"
              style={{ fontFamily: "var(--font-bitcount)" }}
            >
              ALL WORKS
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </Reveal>
        </div>

        {works.length === 0 ? (
          <p className="mt-10 text-sm text-neutral-500">作品正在更新中。</p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {works.map((work, index) => (
              <Reveal
                key={work.id}
                variant="card"
                delay={(index % 3) * 100}
                className={index >= 3 ? "hidden sm:block" : undefined}
              >
                <WorkCard
                  work={work}
                  href={`/works/${work.id}?from=home`}
                  meta={formatWorkMeta([work.category, getWorkYear(work.date)])}
                  sizes="(max-width: 639px) calc(100vw - 48px), (max-width: 1023px) calc(50vw - 56px), calc(33vw - 64px)"
                />
              </Reveal>
            ))}
          </div>
        )}

        <Reveal variant="content" delay={200} className="mt-12">
          <button
            type="button"
            onClick={() => setShowShowreel(true)}
            className="group flex h-12 w-full items-center justify-between bg-neutral-900 px-5 transition-colors duration-300 hover:bg-neutral-800"
          >
            <span className="flex items-center gap-3">
              <span className="translate-y-px text-sm tracking-wider text-neutral-500 md:text-base" style={{ fontFamily: "var(--font-bitcount)" }}>
                REEL
              </span>
              <span className="text-sm text-neutral-400 transition-colors duration-300 group-hover:text-white md:text-base">
                视觉创作总结
              </span>
            </span>
            <span
              aria-hidden="true"
              className="pulse-ring relative flex h-7 w-7 items-center justify-center rounded-full border border-white/40 text-[10px] text-neutral-300"
            >
              ▶
            </span>
          </button>
        </Reveal>
      </div>

      {showShowreel && <ShowreelModal onClose={() => setShowShowreel(false)} />}
    </section>
  );
}
```

- [ ] **Step 5: 删除不再使用的组件与测试**

```bash
git rm components/works-marquee.tsx components/works-drift.tsx components/category-filter.tsx tests/works-drift.test.ts
```

然后确认没有残留引用：

Run: `git grep -n "WorksMarquee\|WorksDrift\|CategoryFilter\|works-drift\|works-marquee" -- app components lib tests`
Expected: 无输出

- [ ] **Step 6: 更新 CSS**

在 `app/globals.css` 中删除以下整段（从 `/* 展开全部作品：...` 注释开始，到 `.marquee-container:hover .animate-marquee { ... }` 结束）：`@keyframes works-expand`、`.animate-works-expand`、`@keyframes works-collapse`、`.animate-works-collapse`、`@keyframes marquee`、`.animate-marquee`、`.marquee-container:hover .animate-marquee`。

在原位置插入：

```css
/* 播放按钮呼吸环：两圈细环缓慢扩散，提示可播放（Works Showreel、首页 REEL 条） */
.pulse-ring::before,
.pulse-ring::after {
  content: "";
  position: absolute;
  inset: -1px;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  pointer-events: none;
  animation: pulse-ring 2.4s ease-out infinite;
}
.pulse-ring::after {
  animation-delay: 1.2s;
}
@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 0.55; }
  100% { transform: scale(1.8); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .pulse-ring::before,
  .pulse-ring::after {
    animation: none;
    opacity: 0;
  }
}
```

- [ ] **Step 7: 运行，确认通过**

Run: `npx tsx --test tests/home-works.test.ts tests/viewport-reveal.test.ts tests/portfolio-navigation.test.ts`
Expected: PASS（`portfolio-navigation` 里的 `ALL WORKS` 与 `?from=home` 测试不需要改）

- [ ] **Step 8: 提交**

```bash
git add components/video-grid.tsx lib/works-index.ts app/globals.css tests/home-works.test.ts tests/viewport-reveal.test.ts
git commit -m "feat(home): replace works marquee with a shared card grid"
```

---

### Task 5: 首页 news. / about. 标题与列表行悬停

**Files:**
- Modify: `components/news-section.tsx`
- Modify: `components/about-section.tsx`
- Modify: `app/globals.css`（新增 `.row-sweep`）
- Modify: `tests/viewport-reveal.test.ts:93-112`
- Test: `tests/row-sweep.test.ts`

**Interfaces:**
- Consumes: Task 2 `SectionHeading`
- Produces: CSS 类 `.row-sweep`（Task 6 的全部作品列表复用）

- [ ] **Step 1: 写失败的测试**

`tests/row-sweep.test.ts`：

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NewsSection } from "../components/news-section";
import type { PostItem } from "../lib/types";

const post: PostItem = {
  id: "p1",
  title: "A post",
  body: "Body",
  tag: null,
  published: true,
  createdAt: new Date("2026-01-01").toISOString(),
};

test("news rows use the shared sweep hover instead of the old side bar", () => {
  const markup = renderToStaticMarkup(createElement(NewsSection, { posts: [post] }));
  assert.match(markup, /row-sweep/);
  assert.doesNotMatch(markup, /hover:bg-white\/5/);
  assert.doesNotMatch(markup, /before:bg-white/);
});

test("row sweep fills from the left, skips touch devices and respects reduced motion", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const start = css.indexOf("/* row-sweep");
  const end = css.indexOf("/* end row-sweep */");
  assert.ok(start >= 0 && end > start, "row-sweep block exists");
  const block = css.slice(start, end);
  assert.match(block, /transform-origin: left/);
  assert.match(block, /scaleX\(0\)/);
  assert.match(block, /@media \(hover: none\)/);
  assert.match(block, /prefers-reduced-motion: reduce/);
});
```

把 `tests/viewport-reveal.test.ts` 中 `"news section stages title and content the same way"` 与 `"about section stages title and content the same way"` 两个测试替换为：

```ts
test("news section stages title and content the same way", () => {
  const markup = renderToStaticMarkup(
    createElement(NewsSection, { posts: [samplePost] })
  );

  assert.match(markup, /data-section-heading="static"/);
  assert.match(markup, /data-reveal="content"/);
  assert.ok(!markup.includes("data-reveal-pending"));
  assert.match(markup, /news\./);
  assert.match(markup, /最新动态/);
});

test("about section stages title and content the same way", () => {
  const markup = renderToStaticMarkup(createElement(AboutSection));

  assert.match(markup, /data-section-heading="static"/);
  assert.match(markup, /data-reveal="content"/);
  assert.ok(!markup.includes("data-reveal-pending"));
  assert.match(markup, /about\./);
  assert.match(markup, /了解更多 &amp; 合作洽谈/);
});
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx tsx --test tests/row-sweep.test.ts tests/viewport-reveal.test.ts`
Expected: FAIL

- [ ] **Step 3: 改 `components/news-section.tsx`**

import 行改为：

```tsx
import type { PostItem } from "@/lib/types";
import { IntentPrefetchLink } from "@/components/intent-prefetch-link";
import { Reveal, SectionDim } from "@/components/viewport-reveal";
import { SectionHeading } from "@/components/section-heading";
```

把 `<SectionDim />` 之后的两个标题 `Reveal`（`news.` 与 `最新动态`）替换为：

```tsx
      <SectionHeading title="news." subtitle="最新动态" />
```

把 `rowClass` 改为：

```tsx
            const rowClass =
              "row-sweep group flex items-start md:items-center gap-3 md:gap-4 px-3 md:px-4 py-3.5 border-b border-neutral-900";
```

- [ ] **Step 4: 改 `components/about-section.tsx`**

import 改为：

```tsx
import { siteConfig, socialLinks } from "@/lib/config";
import { Reveal, SectionDim } from "@/components/viewport-reveal";
import { SectionHeading } from "@/components/section-heading";
```

把 `about.` 与 `了解更多 & 合作洽谈` 两个 `Reveal` 替换为：

```tsx
      <SectionHeading title="about." subtitle="了解更多 & 合作洽谈" />
```

- [ ] **Step 5: 加 CSS**

在 `app/globals.css` 的 `/* SectionHeading` 注释之前插入：

```css
/* row-sweep：列表行悬停时底色从左向右铺满（News 列表、全部作品列表共用）。
   isolation + 负 z-index 让底色垫在文字之下，不必改动子元素定位 */
.row-sweep {
  position: relative;
  isolation: isolate;
}
.row-sweep::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background: #1f1f1f;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 450ms var(--ease-menu);
}
.row-sweep:hover::before,
.row-sweep:focus-visible::before {
  transform: scaleX(1);
}
@media (hover: none) {
  .row-sweep::before {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .row-sweep::before {
    transition: none;
  }
}
/* end row-sweep */
```

- [ ] **Step 6: 运行，确认通过**

Run: `npx tsx --test tests/row-sweep.test.ts tests/viewport-reveal.test.ts`
Expected: PASS

- [ ] **Step 7: 提交**

```bash
git add components/news-section.tsx components/about-section.tsx app/globals.css tests/row-sweep.test.ts tests/viewport-reveal.test.ts
git commit -m "feat(home): share section headings and row sweep in news and about"
```

---

### Task 6: Works 页 —— 卡片网格、章节标题、列表行、Showreel 呼吸环

**Files:**
- Modify: `components/works-index/selected-work-card.tsx`（整体重写）
- Modify: `components/works-index/works-page-copy.tsx`
- Modify: `components/works-index/work-archive.tsx`
- Modify: `components/works-index/showreel-feature.tsx`
- Modify: `lib/works-index.ts`（删除 `getSelectedWorkOrientation`）
- Modify: `tests/works-index.test.ts`

**Interfaces:**
- Consumes: Task 2 `SectionHeading`；Task 3 `WorkCard`、`Reveal variant="card"`、`getWorkYear`、`formatWorkMeta`；Task 4 `.pulse-ring`；Task 5 `.row-sweep`
- Produces: `SelectedWorkCard({ work: VideoRow })`（不再接收 `index`）

- [ ] **Step 1: 改测试**

在 `tests/works-index.test.ts`：

1. 从顶部 import 列表删掉 `getSelectedWorkOrientation,`。
2. 删除 `"alternates selected work media from left to right"` 与 `"renders selected work media in the large desktop track on either side"` 两个测试。
3. 把 `"selected work keeps authored project data while fixed labels default to English"` 替换为：

```ts
test("selected work keeps authored project data while fixed labels default to English", () => {
  const authored = {
    ...work("localized-boundary", "2026-02-01T00:00:00.000Z", true),
    title: "原文标题",
    category: "自主制作",
    role: "Motion Design",
    tools: "After Effects · Blender",
    summary: "作者填写的摘要",
  };
  const markup = renderToStaticMarkup(createElement(SelectedWorkCard, { work: authored }));
  assert.match(markup, /原文标题/);
  assert.match(markup, /自主制作 · 2026/);
  assert.match(markup, /作者填写的摘要/);
  assert.match(markup, /Role Motion Design · Tools After Effects · Blender/);
  assert.match(markup, /aria-label="View case study: 原文标题"/);
});
```

4. 把 `"provider-scoped Chinese localizes fixed labels without touching authored content"` 中的 `createElement(SelectedWorkCard, { work: authored, index: 0 })` 改为 `createElement(SelectedWorkCard, { work: authored })`，并把 `assert.match(markup, /职责/);` 改为 `assert.match(markup, /职责 Motion Design/);`。
5. 把 `"keeps selected work media before details in mobile DOM order"` 替换为：

```ts
test("keeps selected work media before details in DOM order", () => {
  const markup = renderToStaticMarkup(
    createElement(SelectedWorkCard, {
      work: { ...work("mobile-order", null, true), title: "Mobile Order Project" },
    })
  );
  assert.ok(markup.indexOf('data-vt-id="mobile-order"') < markup.indexOf("<h3"));
});
```

6. 在 `"works page copy localizes sections while archive data stays authored"` 中，`const en = ...` 之后追加：

```ts
  assert.match(en, /aria-label="selected\."/);
  assert.match(en, /aria-label="archive\."/);
  assert.match(en, /md:grid-cols-2/);
  assert.match(en, /data-reveal="card"/);
```

在 `const zh = ...` 之后追加：

```ts
  // 切换语言只换副标题，章节标题保持不变
  assert.match(zh, /aria-label="selected\."/);
  assert.match(zh, /aria-label="archive\."/);
```

7. 在文件末尾追加：

```ts
test("archive rows and the showreel button use the shared motion styles", () => {
  const groups = [{ label: "2026", works: [work("one", null)] }];
  const archive = renderToStaticMarkup(createElement(WorkArchive, { groups }));
  assert.match(archive, /row-sweep/);

  const showreel = renderToStaticMarkup(
    createElement(ShowreelFeature, { showreelUrl: "https://example.com/watch?v=abc", videoType: "url" })
  );
  assert.match(showreel, /pulse-ring/);
  assert.match(showreel, /md:group-hover:scale-\[1\.08\]/);
});
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx tsx --test tests/works-index.test.ts`
Expected: FAIL（`aria-label="selected\."`、`row-sweep`、`pulse-ring` 等不匹配）

- [ ] **Step 3: 重写 `components/works-index/selected-work-card.tsx`**

```tsx
import { WorkCard } from "@/components/work-card";
import { formatWorkMeta, getWorkYear } from "@/lib/works-index";
import { useWorksLanguage } from "./works-language-provider";
import type { VideoRow } from "@/lib/types";

// /works 精选作品：与首页共用 WorkCard，另外显示摘要与本地化的 Role / Tools 标签。
// 作品内容（标题、分类、摘要、Role/Tools 的值）保持作者原文。
export function SelectedWorkCard({ work }: { work: VideoRow }) {
  const { copy } = useWorksLanguage();
  const role = work.role?.trim();
  const tools = work.tools?.trim();

  return (
    <WorkCard
      work={work}
      href={`/works/${work.id}`}
      ariaLabel={copy.selected.linkLabel(work.title)}
      meta={formatWorkMeta([work.category, getWorkYear(work.date)])}
      details={formatWorkMeta([
        role ? `${copy.selected.roleLabel} ${role}` : null,
        tools ? `${copy.selected.toolsLabel} ${tools}` : null,
      ])}
      summary={work.summary?.trim() || null}
      size="large"
      sizes="(max-width: 767px) calc(100vw - 40px), (max-width: 1199px) calc(50vw - 56px), 592px"
    />
  );
}
```

- [ ] **Step 4: 改 `components/works-index/works-page-copy.tsx`**

import 区改为：

```tsx
"use client";

import { WorkArchive } from "./work-archive";
import { SelectedWorkCard } from "./selected-work-card";
import { useWorksLanguage } from "./works-language-provider";
import { useLocaleFade } from "./use-locale-fade";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/viewport-reveal";
import type { WorkYearGroup } from "@/lib/works-index";
import type { VideoRow } from "@/lib/types";
```

把 Selected Works 与 All Works 两个 `<section>` 替换为（联系区保持不变）：

```tsx
      {selected.length > 0 && (
        <section aria-labelledby="selected-works-heading" className="mt-24 md:mt-32">
          <SectionHeading
            id="selected-works-heading"
            title="selected."
            subtitle={copy.selected.heading}
            subtitleRef={fade}
          />
          <p ref={fade} className="mt-3 max-w-xl text-sm leading-6 text-neutral-400 md:text-base">
            {copy.selected.description}
          </p>
          <div className="mt-10 grid gap-x-4 gap-y-14 md:mt-12 md:grid-cols-2">
            {selected.map((work, index) => (
              <Reveal key={work.id} variant="card" delay={(index % 2) * 100}>
                <SelectedWorkCard work={work} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="all-works-heading" className="mt-24 md:mt-32">
        <SectionHeading
          id="all-works-heading"
          title="archive."
          subtitle={copy.archive.heading}
          subtitleRef={fade}
        />
        <div className="mt-8 md:mt-10">
          {groups.length > 0 ? (
            <WorkArchive groups={groups} />
          ) : (
            <p ref={fade} className="text-neutral-400">{copy.archive.empty}</p>
          )}
        </div>
      </section>
```

- [ ] **Step 5: 改 `components/works-index/work-archive.tsx`**

年份标题 `h3` 的 className 改为 `"mb-3 text-[13px] tracking-[0.2em] text-neutral-400"`。

`IntentPrefetchLink` 的 className 改为：

```tsx
                  className="row-sweep group grid min-h-14 grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 border-t border-neutral-800 px-2 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:grid-cols-[3rem_minmax(0,1fr)_minmax(10rem,0.35fr)_auto]"
```

箭头 `span` 的 className 改为：

```tsx
                    className="text-neutral-500 transition-[transform,color] duration-300 motion-reduce:transition-none group-hover:translate-x-1 group-hover:text-white"
```

`<ol>` 不加 className（测试依赖 `<ol start="1">` 的精确输出）。

- [ ] **Step 6: 改 `components/works-index/showreel-feature.tsx`**

把播放圆钮那一行：

```tsx
              <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/60 bg-black/35 backdrop-blur-sm transition-transform duration-300 motion-reduce:transition-none md:group-hover:scale-105">
```

改为：

```tsx
              <span className="pulse-ring relative flex h-16 w-16 items-center justify-center rounded-full border border-white/60 bg-black/35 backdrop-blur-sm transition-transform duration-300 motion-reduce:transition-none md:group-hover:scale-[1.08]">
```

- [ ] **Step 7: 删除 `getSelectedWorkOrientation`**

从 `lib/works-index.ts` 删除 `getSelectedWorkOrientation` 函数，并确认没有残留：

Run: `git grep -n "getSelectedWorkOrientation" -- app components lib tests`
Expected: 无输出

- [ ] **Step 8: 运行，确认通过**

Run: `npx tsx --test tests/works-index.test.ts`
Expected: PASS

- [ ] **Step 9: 提交**

```bash
git add components/works-index/selected-work-card.tsx components/works-index/works-page-copy.tsx components/works-index/work-archive.tsx components/works-index/showreel-feature.tsx lib/works-index.ts tests/works-index.test.ts
git commit -m "feat(works): unify selected works, archive rows and showreel with home"
```

---

### Task 7: Hero 名字逐字入场

**Files:**
- Create: `lib/hero-intro.ts`
- Modify: `components/hero-video.tsx`
- Modify: `app/globals.css`
- Test: `tests/hero-intro.test.ts`

**Interfaces:**
- Produces: `HERO_LETTER_STAGGER_MS = 40`、`HERO_SUBTITLE_DELAY_MS = 160`、`HERO_BUTTON_DELAY_MS = 280`、`getHeroLetters(name: string): Array<{ char: string; delayMs: number }>`；DOM：`h1[data-hero-intro]` 内每个字 `span.hero-letter`，副标题与手机 CTA 外层 `.hero-sub[data-hero-intro]`

- [ ] **Step 1: 写失败的测试**

`tests/hero-intro.test.ts`：

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HeroVideo } from "../components/hero-video";
import { siteConfig } from "../lib/config";
import {
  HERO_BUTTON_DELAY_MS,
  HERO_SUBTITLE_DELAY_MS,
  getHeroLetters,
} from "../lib/hero-intro";

test("hero letters stagger by 40ms", () => {
  assert.deepEqual(getHeroLetters("abc"), [
    { char: "a", delayMs: 0 },
    { char: "b", delayMs: 40 },
    { char: "c", delayMs: 80 },
  ]);
  assert.deepEqual(getHeroLetters(""), []);
});

test("subtitle and button follow the name tightly", () => {
  assert.equal(HERO_SUBTITLE_DELAY_MS, 160);
  assert.equal(HERO_BUTTON_DELAY_MS, 280);
});

test("hero SSR renders the name as masked letters without a hidden state", () => {
  const markup = renderToStaticMarkup(createElement(HeroVideo, { videoUrl: null }));
  assert.match(markup, new RegExp(`aria-label="${siteConfig.name}"`));
  assert.equal(markup.match(/class="hero-letter"/g)?.length, Array.from(siteConfig.name).length);
  assert.match(markup, /data-hero-intro="static"/);
  assert.match(markup, /--intro-delay:40ms/);
  assert.match(markup, /--intro-delay:160ms/);
  assert.match(markup, /--intro-delay:280ms/);
  assert.doesNotMatch(markup, /data-hero-intro="pending"/);
  // 现有文案与结构不变
  assert.match(markup, /跳转至 works\./);
  assert.match(markup, /data-mobile-hero-primary="true"/);
});

test("hero intro CSS masks letters and has a reduced-motion fallback", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const start = css.indexOf("/* Hero 入场");
  const end = css.indexOf("/* end Hero 入场 */");
  assert.ok(start >= 0 && end > start, "hero intro block exists");
  const block = css.slice(start, end);
  assert.match(block, /\[data-hero-intro="pending"\] \.hero-letter \{[^}]*translateY\(110%\)/);
  assert.match(block, /prefers-reduced-motion: reduce/);
  assert.match(block, /\.hero-letter,\s*\.hero-sub \{[^}]*transition: none !important/);
});
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx tsx --test tests/hero-intro.test.ts`
Expected: FAIL，找不到 `../lib/hero-intro`

- [ ] **Step 3: 实现 `lib/hero-intro.ts`**

```ts
// Hero 入场节奏（Design 画布「动效方案」第 1 项）：
// 名字逐字从遮罩下升起，副标题与按钮紧随其后。
export const HERO_LETTER_STAGGER_MS = 40;
export const HERO_SUBTITLE_DELAY_MS = 160;
export const HERO_BUTTON_DELAY_MS = 280;

export function getHeroLetters(name: string): Array<{ char: string; delayMs: number }> {
  return Array.from(name).map((char, index) => ({
    char,
    delayMs: index * HERO_LETTER_STAGGER_MS,
  }));
}
```

- [ ] **Step 4: 改 `components/hero-video.tsx`**

1. import 区：

```tsx
import { useEffect, useRef, useState, useLayoutEffect } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { DEFAULT_HERO_POSTER_URL } from "@/lib/hero";
import {
  HERO_BUTTON_DELAY_MS,
  HERO_SUBTITLE_DELAY_MS,
  getHeroLetters,
} from "@/lib/hero-intro";
import { LoadingScreen } from "./loading-screen";
import { SCROLL_CONTAINER_ID } from "./smooth-scroll-container";
```

2. 在 `const [loaderVisible, setLoaderVisible] = useState(false);` 之后加：

```tsx
  // 名字逐字入场只在首访（有加载层遮住页面时）播放；刷新 / 回访保持静态，
  // 避免已经绘制出来的名字先消失再升起。
  const [introPhase, setIntroPhase] = useState<"static" | "pending" | "play">("static");
```

3. 加载层的 `useLayoutEffect` 中，把

```tsx
    requestAnimationFrame(() => setLoaderVisible(true));
```

改为

```tsx
    requestAnimationFrame(() => {
      setLoaderVisible(true);
      setIntroPhase("pending");
    });
```

4. `handleLoadReady` 中，把 `setFadeOut(true);` 改为：

```tsx
      setFadeOut(true);
      setIntroPhase("play");
```

5. `finishIntro` 中，把 `buttonRef` 这段里的

```tsx
      buttonRef.current.style.transition = "opacity 700ms ease";
```

改为

```tsx
      buttonRef.current.style.transition = `opacity 600ms ease ${HERO_BUTTON_DELAY_MS}ms`;
```

并把紧随其后的 `setTimeout(() => { if (buttonRef.current) buttonRef.current.style.transition = ""; }, 720);` 中的 `720` 改为 `900`。

6. 把 `h1`、副标题 `p` 和手机 CTA `Link` 替换为：

```tsx
          <h1
            aria-label={siteConfig.name}
            data-hero-intro={introPhase}
            className="mb-3 overflow-hidden text-4xl font-normal leading-[1.08] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl"
            style={{ fontFamily: "var(--font-montserrat)" }}
          >
            {getHeroLetters(siteConfig.name).map(({ char, delayMs }, index) => (
              <span
                key={index}
                aria-hidden="true"
                className="hero-letter"
                style={{ "--intro-delay": `${delayMs}ms` } as CSSProperties}
              >
                {char}
              </span>
            ))}
          </h1>
          <p
            data-hero-intro={introPhase}
            className="hero-sub text-lg font-light text-neutral-400 sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl"
            style={{ fontFamily: "var(--font-montserrat)", "--intro-delay": `${HERO_SUBTITLE_DELAY_MS}ms` } as CSSProperties}
          >
            {siteConfig.title}
          </p>
          {/* 外层包一层做入场，避免覆盖 Link 自身的颜色过渡 */}
          <div
            data-hero-intro={introPhase}
            className="hero-sub"
            style={{ "--intro-delay": `${HERO_BUTTON_DELAY_MS}ms` } as CSSProperties}
          >
            <Link
              href="/works"
              className="group mt-6 inline-flex min-h-11 items-center gap-2 border border-neutral-400 px-4 py-2.5 text-[13px] text-neutral-200 transition-colors duration-300 hover:border-white hover:text-white md:hidden"
              style={{ fontFamily: "var(--font-bitcount)" }}
            >
              跳转至 works.
              <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </div>
```

- [ ] **Step 5: 加 CSS**

在 `app/globals.css` 的 `/* row-sweep` 注释之前插入：

```css
/* Hero 入场：名字逐字从遮罩下升起，副标题与按钮紧随其后（节奏见 lib/hero-intro.ts）。
   pending 只在首访、加载层遮住页面时由 HeroVideo 设置 */
.hero-letter {
  display: inline-block;
  transition: transform 800ms var(--ease-menu) var(--intro-delay, 0ms);
}
[data-hero-intro="pending"] .hero-letter {
  transform: translateY(110%);
}
.hero-sub {
  transition:
    opacity 600ms var(--ease-menu) var(--intro-delay, 0ms),
    transform 600ms var(--ease-menu) var(--intro-delay, 0ms);
}
.hero-sub[data-hero-intro="pending"] {
  opacity: 0;
  transform: translateY(10px);
}
@media (prefers-reduced-motion: reduce) {
  .hero-letter,
  .hero-sub {
    transition: none !important;
    transform: none !important;
    opacity: 1 !important;
  }
}
/* end Hero 入场 */
```

- [ ] **Step 6: 运行，确认通过**

Run: `npx tsx --test tests/hero-intro.test.ts tests/portfolio-navigation.test.ts`
Expected: PASS（`portfolio-navigation` 中 Hero 的 `跳转至 works.`、`SCROLL`、`md:bottom-28` 等测试保持通过）

- [ ] **Step 7: 提交**

```bash
git add lib/hero-intro.ts components/hero-video.tsx app/globals.css tests/hero-intro.test.ts
git commit -m "feat(motion): reveal the hero name letter by letter"
```

---

### Task 8: 桌面导航链接、滑动下划线与滚动进度线

**Files:**
- Modify: `lib/portfolio-navigation.ts`（追加导出）
- Modify: `components/navbar.tsx`
- Modify: `tests/portfolio-navigation.test.ts`

**Interfaces:**
- Produces:
  - `type NavSectionId = "works" | "news" | "about"`、`NAV_SECTION_IDS: NavSectionId[]`
  - `getActiveNavSection(pathname: string, sectionTops: Partial<Record<NavSectionId, number>>, scrollTop: number, viewportHeight: number): NavSectionId | null`
  - `getScrollProgress(scrollTop: number, scrollHeight: number, clientHeight: number): number`
  - `shouldShowScrollProgress(pathname: string): boolean`

- [ ] **Step 1: 写失败的测试**

在 `tests/portfolio-navigation.test.ts` 顶部 import 区加入 `import { readFileSync } from "node:fs";`，并把 `../lib/portfolio-navigation` 的 import 改为：

```ts
import {
  getActiveNavSection,
  getPortfolioMenuPrimary,
  getScrollProgress,
  shouldGateNavbarOnIntro,
  shouldShowScrollProgress,
  shouldShowServerNotice,
  shouldUseBlackTransition,
} from "../lib/portfolio-navigation";
```

文件末尾追加：

```ts
test("desktop nav marks Works throughout the Works route tree", () => {
  assert.equal(getActiveNavSection("/works", {}, 0, 800), "works");
  assert.equal(getActiveNavSection("/works/abc", {}, 0, 800), "works");
  assert.equal(getActiveNavSection("/news/abc", { works: 0 }, 5000, 800), null);
});

test("homepage nav follows the section crossing 40% of the viewport", () => {
  const tops = { works: 900, news: 2400, about: 3000 };
  assert.equal(getActiveNavSection("/", tops, 0, 1000), null);
  assert.equal(getActiveNavSection("/", tops, 600, 1000), "works");
  assert.equal(getActiveNavSection("/", tops, 2100, 1000), "news");
  assert.equal(getActiveNavSection("/", tops, 2700, 1000), "about");
});

test("homepage nav tolerates missing sections", () => {
  assert.equal(getActiveNavSection("/", { works: 900, about: 3000 }, 2100, 1000), "works");
  assert.equal(getActiveNavSection("/", {}, 2100, 1000), null);
});

test("scroll progress is clamped and safe on short pages", () => {
  assert.equal(getScrollProgress(0, 2000, 1000), 0);
  assert.equal(getScrollProgress(500, 2000, 1000), 0.5);
  assert.equal(getScrollProgress(1500, 2000, 1000), 1);
  assert.equal(getScrollProgress(-20, 2000, 1000), 0);
  assert.equal(getScrollProgress(0, 800, 1000), 0);
});

test("scroll progress line only shows on the homepage and works index", () => {
  assert.equal(shouldShowScrollProgress("/"), true);
  assert.equal(shouldShowScrollProgress("/works"), true);
  assert.equal(shouldShowScrollProgress("/works/abc"), false);
  assert.equal(shouldShowScrollProgress("/news/abc"), false);
  assert.equal(shouldShowScrollProgress("/dashboard"), false);
});

test("navbar uses inline desktop links and keeps the mobile menu", () => {
  const source = readFileSync(new URL("../components/navbar.tsx", import.meta.url), "utf8");
  assert.match(source, /hidden items-center gap-10 md:flex/);
  assert.match(source, /md:hidden/);
  assert.match(source, /getActiveNavSection/);
  assert.match(source, /getScrollProgress/);
  assert.match(source, /shouldShowScrollProgress/);
  assert.match(source, /aria-current/);
  assert.match(source, /motion-reduce:transition-none/);
  // 桌面右侧抽屉与遮罩已移除
  assert.doesNotMatch(source, /w-1\/4 min-w-\[320px\]/);
});
```

- [ ] **Step 2: 运行，确认失败**

Run: `npx tsx --test tests/portfolio-navigation.test.ts`
Expected: FAIL（新函数不存在）

- [ ] **Step 3: 在 `lib/portfolio-navigation.ts` 末尾追加**

```ts
export type NavSectionId = "works" | "news" | "about";

export const NAV_SECTION_IDS: NavSectionId[] = ["works", "news", "about"];

// 桌面导航下划线的目标：/works 路由树固定在 WORKS；
// 首页取「上沿越过视口 40% 位置」的最后一个板块，仍在 Hero 时为 null（隐藏下划线）。
export function getActiveNavSection(
  pathname: string,
  sectionTops: Partial<Record<NavSectionId, number>>,
  scrollTop: number,
  viewportHeight: number
): NavSectionId | null {
  if (pathname === "/works" || pathname.startsWith("/works/")) return "works";
  if (pathname !== "/") return null;
  const line = scrollTop + viewportHeight * 0.4;
  let active: NavSectionId | null = null;
  for (const id of NAV_SECTION_IDS) {
    const top = sectionTops[id];
    if (top !== undefined && top <= line) active = id;
  }
  return active;
}

export function getScrollProgress(scrollTop: number, scrollHeight: number, clientHeight: number): number {
  const max = scrollHeight - clientHeight;
  if (max <= 0) return 0;
  return Math.min(1, Math.max(0, scrollTop / max));
}

// 顶部 1px 滚动进度线只在首页与 works 索引页显示
export function shouldShowScrollProgress(pathname: string): boolean {
  return pathname === "/" || pathname === "/works";
}
```

- [ ] **Step 4: 改 `components/navbar.tsx`**

1. import 改为：

```tsx
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
```

2. 在 `const primaryItem = getPortfolioMenuPrimary(pathname);` 之后加：

```tsx
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
```

3. 把滚动监听 effect 里的 `check` 函数替换为：

```tsx
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
      setActiveSection(getActiveNavSection(pathname, tops, scrollTop, viewport));

      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${getScrollProgress(scrollTop, scrollHeight, viewport)})`;
      }
    }
```

4. 在 `return (` 里 `<nav ...>` 开标签之后、`<div className={\`px-4 md:px-6 h-16 ...` 之前插入进度线：

```tsx
      {showProgress && (
        <div
          ref={progressRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px origin-left bg-white"
          style={{ transform: "scaleX(0)" }}
        />
      )}
```

5. 把汉堡按钮替换为「桌面链接 + 手机汉堡」：

```tsx
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
```

6. 删除 `{/* 桌面端：遮罩压黑 */}` 与 `{/* 桌面端：右侧 1/4 宽面板 */}` 两个 `{mounted && (...)}` 块。手机全屏菜单（`md:hidden fixed inset-0 top-16`）保持不变。

- [ ] **Step 5: 运行，确认通过**

Run: `npx tsx --test tests/portfolio-navigation.test.ts`
Expected: PASS

- [ ] **Step 6: 类型检查**

Run: `npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 7: 提交**

```bash
git add lib/portfolio-navigation.ts components/navbar.tsx tests/portfolio-navigation.test.ts
git commit -m "feat(nav): add desktop links with scroll-synced underline and progress line"
```

---

### Task 9: 全量验证与交接

**Files:**
- Modify: `HANDOFF.md`（未被跟踪，只更新不提交）

- [ ] **Step 1: 全量测试、类型、lint**

Run: `npm test`
Expected: 全部 PASS

Run: `npx tsc --noEmit`
Expected: 无错误

Run: `npx eslint app components lib tests proxy.ts`
Expected: 0 error；warning 不多于既有的 5 条

- [ ] **Step 2: 构建检查（可能因网络失败）**

Run: `npx next build --webpack`
Expected: 成功。若因 `next/font` 连不上 Google Fonts 或 `/dashboard/settings` 预渲染 `ECONNREFUSED` 失败，记录原文并在交接中标为「构建：未验证」，不要说构建通过。

- [ ] **Step 3: 浏览器检查**

用 `preview_start`（`.claude/launch.json` 的 `next-dev`，端口 3100）打开首页与 `/works`，只浏览、不做任何写操作：

1. 1280 宽：首页首访（清空 sessionStorage 后刷新）名字逐字升起、副标题紧随；滚动时 works./news./about. 标题解码、副标题从左擦出；卡片按列错峰揭示；悬停卡片出现 ▶ PLAY 与下划线；悬停 News 行底色铺满；导航下划线随板块滑动；顶部进度线随滚动增长。
2. `/works`：`selected.` / `archive.` 标题解码；精选两列卡片；全部作品行悬停；Showreel 呼吸环；切换 EN/中文 后副标题变化、标题不变；导航 WORKS 常亮带下划线。
3. 375 宽：首页只显示 3 张卡片；手机汉堡菜单正常；进度线跟随 window 滚动。
4. `resize_window` 设 `colorScheme` 无关；用 DevTools 渲染面板或 `javascript_tool` 检查 `matchMedia('(prefers-reduced-motion: reduce)')` 下的表现：如无法在工具中模拟，如实记为「减少动态效果：未在浏览器中验证（仅 CSS 测试覆盖）」。
5. `read_console_messages` 无新增报错。

- [ ] **Step 4: 更新 `HANDOFF.md`**

在「## 新对话先看这里」之前加一节 `## 2026-09-29：首页与 Works 统一改版 + 动效`，写明：分支名、设计与计划路径、Design 画布链接、已验证项（附命令结果）、未验证项（构建、减少动态效果的浏览器验证等）、已删除的组件（`works-marquee`、`works-drift`、`category-filter`）。不要 `git add HANDOFF.md`。

- [ ] **Step 5: 最终提交状态检查**

Run: `git status -sb` 与 `git log --oneline master..HEAD`
Expected: 工作区只剩用户原有的未跟踪文件与 `HANDOFF.md` 修改；分支上约 9 个提交。合入 `master` 与推送等用户说「push」再做。
