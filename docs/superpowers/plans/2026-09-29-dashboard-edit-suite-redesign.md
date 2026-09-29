# Dashboard「剪辑台」重设计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `/login` 与 `/dashboard/*` 换成「剪辑台」视觉系统，并完成编辑器媒体字段精简、页面媒体紧凑化、登录页重做、News 列表重排，业务行为不变。

**Architecture:** 在 `app/globals.css` 定义后台专属 `--admin-*` 变量，经 `@theme inline` 生成 Tailwind 工具类；在 `:root:has([data-admin-theme])` 下覆盖 shadcn 变量，使 Portal 中的 Dialog/Menu 同样生效。新增少量共享组件（页头、状态点、筛选组、搜索、空状态、MediaField），各页面只换界面层；`lib/admin-*` 业务逻辑仅增加两处小改动。

**Tech Stack:** Next.js 16.2 App Router、React 19、Tailwind CSS 4、Base UI（`components/ui`）、lucide-react、`next/font/google`、Node test runner + tsx。

**Spec:** `docs/superpowers/specs/2026-09-29-dashboard-edit-suite-redesign-design.md`

## Global Constraints

- 颜色值（逐字）：canvas `#0b0b0c`、panel `#111113`、raised `#16161a`、selected `#1c1c21`、line `#222227`、line-strong `#2e2e35`、fg `#ededee`、fg-2 `#a1a1a8`、fg-3 `#7a7a83`、accent `#ff5a1f`、accent-fg `#1a0800`、accent-text `#ff8a5c`、success `#3ecf8e`、success-text `#5fd49a`、danger `#f2555a`。
- 每屏最多一个处于橙色状态的主按钮。
- 最小字号 12px；控件/行圆角 4px，面板/弹窗 8px；只有弹出菜单与弹窗有阴影。
- 像素字（`font-pixel`）只用于英文页标题与 nonacola3 字标；等宽字（`font-admin-mono`）只用于日期、数量、大小、文件名、地址、分区编号、面包屑前缀。
- 界面文字中文；页标题英文：WORKS / ORDER / NEWS / LIBRARY / PAGE MEDIA。日期格式 `YYYY.MM.DD`。
- 不改：API 路由、`lib/schemas.ts`、Prisma、鉴权三层、`proxy.ts`、缓存标签、前台组件视觉；根布局只新增 JetBrains Mono 变量（`preload: false`）。
- 不运行 `npm run build`；构建检查用 `npx next build --webpack`。不写生产数据。
- 只 `git add` 本次相关文件；不得提交 `.env`、`.opencode/`、`start-dsh.ps1`、`.superpowers/`、`dev-server.log`、`handoff-mobile-layout.json`、`.playwright-cli/`、`tmp/`、`AGENTS.md`、`HANDOFF.md`。
- 提交信息结尾：`Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`。

## Review Focus

1. 超长作品/文章标题（中日文 + 括号，60+ 字）在 375px 宽的列表行和编辑器吸顶栏里必须截断，不能撑破布局 —— Task 4、Task 7 的源码断言钉住 `min-w-0` + `truncate`。
2. 作品视频地址粘贴的是整段 `<iframe src="…">` 代码或 `player.bilibili.com/player.html?bvid=…` —— `describeMediaSource` 必须识别为 Bilibili，而不是「外部链接」（Task 6 测试）。
3. 站内相对路径 `/hero-poster.webp`、带查询串的 Blob 地址、无法解析的字符串 —— 不能抛异常，分别给出 local / 媒体库 / 外部三种描述（Task 6 测试）。
4. 前台页面没有 `data-admin-theme`，shadcn 变量覆盖不能泄漏到前台；后台 Portal 中的菜单/弹窗必须拿到后台变量 —— Task 1 测试断言覆盖只写在 `:root:has([data-admin-theme])` 里。
5. 页面媒体里用户手动选回已保存的同一文件，或对某一槽「撤销」后整组与已保存值相同 —— 状态必须回到 `clean`，保存按钮不再是橙色（Task 9 测试）。

---

## File Structure

| 文件 | 职责 |
|---|---|
| `app/globals.css`（改） | 后台变量、`@theme inline` 映射、`:root:has([data-admin-theme])` 覆盖 |
| `app/layout.tsx`（改） | 声明 JetBrains Mono（`variable: "--font-jetbrains-mono"`, `preload: false`） |
| `components/ui/menu.tsx`（改） | 菜单外观改用 token（仅后台使用） |
| `components/admin/admin-page-header.tsx`（重写） | 像素标题 + 中文副标题 + 统计 + 操作 + 可选返回链接 |
| `components/admin/admin-status.tsx`（新，取代 `admin-status-badge.tsx`） | 状态点 + 文字，`data-admin-status` |
| `components/admin/admin-filter-group.tsx`（新） | 筛选按钮组（带数量） |
| `components/admin/admin-search.tsx`（新） | 带图标的搜索框 |
| `components/admin/admin-empty-state.tsx`（新） | 空状态 / 筛选无结果 |
| `components/admin/admin-toolbar.tsx`（改） | 面板底色工具栏 |
| `components/admin/admin-form-section.tsx`（改） | `01 基本信息` 编号分区 |
| `components/admin/admin-shell.tsx`（改） | 侧栏、移动顶栏、抽屉、`data-admin-theme` |
| `app/(admin)/login/page.tsx`（重写） | 登录面板 |
| `lib/admin-navigation.ts`（改） | `isAdminPath` 含 `/login`；新增 `formatAdminDate` |
| `components/admin/works-list.tsx`、`work-order-editor.tsx`、`news-list.tsx`（重写） | 列表 |
| `lib/admin-media-source.ts`（新） | `describeMediaSource(url)` 纯函数 |
| `components/admin/media-picker.tsx`（重写） | `MediaPickerDialog`（只负责弹窗）+ `MediaUploadButton` |
| `components/admin/media-field.tsx`（新） | 编辑器媒体槽（`size="compact" \| "large"`） |
| `components/admin/admin-editor-header.tsx`、`work-editor.tsx`、`work-card-preview.tsx`、`article-editor.tsx`、`short-post-editor.tsx`（改） | 编辑器 |
| `app/(admin)/dashboard/works/[id]/edit/page.tsx`、`works/new/page.tsx`、`news/[id]/edit/page.tsx`、`news/new/page.tsx`、`works/order/page.tsx`（改） | 去掉外层标题 / 兼容选择页 |
| `components/admin/media-library.tsx`、`admin-media-skeleton.tsx`（改） | 媒体库 |
| `lib/admin-settings.ts`（改） | `revert-field` 事件；`change` 回到已保存值时为 `clean` |
| `components/admin/page-settings.tsx`（重写） | 页面媒体 |
| `app/(admin)/dashboard/loading.tsx`、`media/loading.tsx`、`settings/loading.tsx`（改） | 骨架 |
| `tests/admin-theme.test.ts`（新）、`tests/admin-media-source.test.ts`（新），`tests/admin-ui.test.ts`、`admin-works.test.ts`、`admin-news.test.ts`、`admin-settings.test.ts`、`admin-media.test.ts`（改） | 测试 |

---

### Task 1: 后台主题变量与字体

**Files:**
- Modify: `app/globals.css`（在 `@layer base` 之前追加后台块）
- Modify: `app/layout.tsx`
- Modify: `components/ui/menu.tsx`
- Test: `tests/admin-theme.test.ts`（新）

**Interfaces:**
- Produces: Tailwind 工具类 `bg-admin-{canvas,panel,raised,selected}`、`border-admin-{line,line-strong}`、`text-admin-{fg,fg-2,fg-3,accent,accent-fg,accent-text,success-text,danger}`、`bg-admin-{accent,success,danger}`、`font-pixel`、`font-admin-mono`；属性约定 `data-admin-theme`。

- [ ] **Step 1: 写失败测试** `tests/admin-theme.test.ts`

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");

test("admin palette is defined once with the approved values", () => {
  for (const [name, value] of [
    ["canvas", "#0b0b0c"], ["panel", "#111113"], ["raised", "#16161a"], ["selected", "#1c1c21"],
    ["line", "#222227"], ["line-strong", "#2e2e35"], ["fg", "#ededee"], ["fg-2", "#a1a1a8"],
    ["fg-3", "#7a7a83"], ["accent", "#ff5a1f"], ["accent-fg", "#1a0800"], ["accent-text", "#ff8a5c"],
    ["success", "#3ecf8e"], ["success-text", "#5fd49a"], ["danger", "#f2555a"],
  ]) {
    assert.match(css, new RegExp(`--admin-${name}:\\s*${value};`), name);
    assert.match(css, new RegExp(`--color-admin-${name}:\\s*var\\(--admin-${name}\\);`), `${name} utility`);
  }
  assert.match(css, /--font-pixel:\s*var\(--font-bitcount\)/);
  assert.match(css, /--font-admin-mono:\s*var\(--font-jetbrains-mono\)/);
});

test("shadcn overrides only apply while an admin surface is mounted", () => {
  const scoped = css.match(/:root:has\(\[data-admin-theme\]\)\s*\{([^}]+)\}/)?.[1] ?? "";
  for (const variable of ["--primary", "--primary-foreground", "--border", "--input", "--ring", "--popover", "--muted-foreground", "--destructive"]) {
    assert.match(scoped, new RegExp(`${variable}:`), variable);
  }
  assert.match(scoped, /--primary:\s*#ff5a1f;/);
  const dark = css.match(/\.dark\s*\{([^}]+)\}/)?.[1] ?? "";
  assert.doesNotMatch(dark, /ff5a1f/);
});

test("the admin mono font is declared without preloading on public pages", () => {
  assert.match(layout, /JetBrains_Mono\(/);
  assert.match(layout, /variable:\s*"--font-jetbrains-mono"/);
  assert.match(layout, /preload:\s*false/);
  assert.match(layout, /\$\{jetbrainsMono\.variable\}/);
});
```

- [ ] **Step 2: 运行确认失败** — `npx tsx --test tests/admin-theme.test.ts`，预期 3 个 FAIL。

- [ ] **Step 3: 实现**

`app/globals.css` 在 `@layer base {` 之前插入：

```css
/* ===== 后台「剪辑台」主题：仅 /login 与 /dashboard 使用 ===== */
@theme inline {
  --color-admin-canvas: var(--admin-canvas);
  --color-admin-panel: var(--admin-panel);
  --color-admin-raised: var(--admin-raised);
  --color-admin-selected: var(--admin-selected);
  --color-admin-line: var(--admin-line);
  --color-admin-line-strong: var(--admin-line-strong);
  --color-admin-fg: var(--admin-fg);
  --color-admin-fg-2: var(--admin-fg-2);
  --color-admin-fg-3: var(--admin-fg-3);
  --color-admin-accent: var(--admin-accent);
  --color-admin-accent-fg: var(--admin-accent-fg);
  --color-admin-accent-text: var(--admin-accent-text);
  --color-admin-success: var(--admin-success);
  --color-admin-success-text: var(--admin-success-text);
  --color-admin-danger: var(--admin-danger);
  --font-pixel: var(--font-bitcount), ui-monospace, monospace;
  --font-admin-mono: var(--font-jetbrains-mono), ui-monospace, "SFMono-Regular", Consolas, monospace;
}

:root {
  --admin-canvas: #0b0b0c;
  --admin-panel: #111113;
  --admin-raised: #16161a;
  --admin-selected: #1c1c21;
  --admin-line: #222227;
  --admin-line-strong: #2e2e35;
  --admin-fg: #ededee;
  --admin-fg-2: #a1a1a8;
  --admin-fg-3: #7a7a83;
  --admin-accent: #ff5a1f;
  --admin-accent-fg: #1a0800;
  --admin-accent-text: #ff8a5c;
  --admin-success: #3ecf8e;
  --admin-success-text: #5fd49a;
  --admin-danger: #f2555a;
}

/* Portal 渲染在 body 下，所以覆盖写在 :root 上，只在后台界面挂载时生效 */
:root:has([data-admin-theme]) {
  --background: #0b0b0c;
  --foreground: #ededee;
  --card: #111113;
  --card-foreground: #ededee;
  --popover: #16161a;
  --popover-foreground: #ededee;
  --primary: #ff5a1f;
  --primary-foreground: #1a0800;
  --secondary: #1c1c21;
  --secondary-foreground: #ededee;
  --muted: #1c1c21;
  --muted-foreground: #a1a1a8;
  --accent: #1c1c21;
  --accent-foreground: #ededee;
  --destructive: #f2555a;
  --border: #222227;
  --input: #2e2e35;
  --ring: #ff5a1f;
  --radius: 0.25rem;
}
```

`app/layout.tsx`：`import { Inter, Montserrat, Bitcount_Grid_Single, JetBrains_Mono } from "next/font/google";`，新增

```ts
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  preload: false,
});
```

`body` className 追加 `${jetbrainsMono.variable}`。

`components/ui/menu.tsx`：Popup 类改为 `min-w-40 rounded-lg bg-popover p-1 text-popover-foreground shadow-xl ring-1 ring-border outline-none`；`menuItemClassName` 中 `rounded-md` → `rounded-sm`，`text-neutral-200` → `text-admin-fg`，`data-[highlighted]:bg-white/10` → `data-[highlighted]:bg-admin-selected`；Separator `bg-white/10` → `bg-border`；Trigger 焦点环 `focus-visible:ring-white/50` → `focus-visible:ring-ring`。（`tests/admin-ui.test.ts` 要求 menu 仍含 `focus:` 与 `outline-none`，保持。）

- [ ] **Step 4: 运行测试** — `npx tsx --test tests/admin-theme.test.ts tests/admin-ui.test.ts`，预期全 PASS。
- [ ] **Step 5: 提交** — `git add app/globals.css app/layout.tsx components/ui/menu.tsx tests/admin-theme.test.ts && git commit -m "feat(admin): add edit-suite theme tokens"`

---

### Task 2: 共享组件

**Files:**
- Rewrite: `components/admin/admin-page-header.tsx`
- Create: `components/admin/admin-status.tsx`（删除 `admin-status-badge.tsx`，同任务内替换所有引用：`works-list.tsx`、`work-order-editor.tsx`、`news-list.tsx`、`media-library.tsx`、`page-settings.tsx`，引用处先换成 `AdminStatus` 的等价 tone，页面重写在后续任务）
- Create: `components/admin/admin-filter-group.tsx`、`admin-search.tsx`、`admin-empty-state.tsx`
- Modify: `components/admin/admin-toolbar.tsx`、`admin-form-section.tsx`
- Modify: `lib/admin-navigation.ts`（新增 `formatAdminDate`）
- Test: `tests/admin-ui.test.ts`

**Interfaces:**
- Produces:
  - `AdminPageHeader({ title: string; subtitle: string; meta?: ReactNode; actions?: ReactNode; back?: { href: string; label: string } })` — `title` 为英文像素标题（`<h1>`，`aria-label` 用 `subtitle`，使读屏读中文）。
  - `type AdminStatusTone = "featured" | "ordinary" | "published" | "draft" | "dirty" | "saving" | "saved" | "error"`；`AdminStatus({ tone, children })` 渲染 `<span data-admin-status={tone}>` + 点 + 文字。实心点：featured / dirty（橙）、published / saved（绿）、error（红）；空心灰点：ordinary / draft；saving 用旋转的 `Loader2`。
  - `AdminFilterGroup<T extends string>({ label: string; value: T; options: Array<{ value: T; label: string; count?: number }>; onChange: (value: T) => void })` — `role="group"`，按钮 `aria-pressed`。
  - `AdminSearch({ id: string; label: string; value: string; placeholder: string; onChange: (value: string) => void })`。
  - `AdminEmptyState({ icon: LucideIcon; title: string; description?: string; action?: ReactNode })`。
  - `AdminToolbar({ filters: ReactNode; search?: ReactNode; actions?: ReactNode })`。
  - `AdminFormSection({ index: string; title: string; description?: string; children: ReactNode })` — 渲染 `<section>`，标题行 `<span class="font-admin-mono">{index}</span><h2>{title}</h2>`。
  - `formatAdminDate(iso: string | null): string` — 返回 `YYYY.MM.DD`（按本地时区），`null`/无效返回 `"—"`。

- [ ] **Step 1: 写失败测试**（替换 `tests/admin-ui.test.ts` 中「ordinary and featured states share the same badge structure」与「page media sections can use the full content width…」两条，并新增）

```ts
import { AdminStatus } from "../components/admin/admin-status";
import { AdminPageHeader } from "../components/admin/admin-page-header";
import { AdminFormSection } from "../components/admin/admin-form-section";
import { AdminEmptyState } from "../components/admin/admin-empty-state";
import { formatAdminDate } from "../lib/admin-navigation";
import { Film } from "lucide-react";

test("status tones render a dot plus visible text with a stable data attribute", () => {
  for (const tone of ["featured", "ordinary", "published", "draft", "dirty", "saved", "error"] as const) {
    const markup = renderToStaticMarkup(createElement(AdminStatus, { tone }, "状态"));
    assert.match(markup, new RegExp(`data-admin-status="${tone}"`));
    assert.match(markup, /aria-hidden="true"/);
    assert.match(markup, />状态</);
  }
  assert.match(renderToStaticMarkup(createElement(AdminStatus, { tone: "featured" }, "精选")), /bg-admin-accent/);
  assert.match(renderToStaticMarkup(createElement(AdminStatus, { tone: "draft" }, "草稿")), /border-admin-fg-3/);
});

test("page header pairs an English pixel title with a Chinese subtitle", () => {
  const markup = renderToStaticMarkup(createElement(AdminPageHeader, {
    title: "WORKS", subtitle: "作品", meta: "7 个作品", actions: createElement("button", null, "新建作品"),
  }));
  assert.match(markup, /<h1[^>]*aria-label="作品"[^>]*>WORKS<\/h1>/);
  assert.match(markup, /font-pixel/);
  assert.match(markup, />7 个作品</);
  assert.match(markup, />新建作品</);
});

test("form sections use a mono index instead of a side description column", () => {
  const markup = renderToStaticMarkup(createElement(AdminFormSection, { index: "01", title: "基本信息", children: createElement("div", null, "字段") }));
  assert.match(markup, /font-admin-mono[^>]*>01</);
  assert.match(markup, /<h2[^>]*>基本信息<\/h2>/);
  assert.doesNotMatch(markup, /lg:grid-cols-/);
});

test("empty states name the space and offer an action", () => {
  const markup = renderToStaticMarkup(createElement(AdminEmptyState, { icon: Film, title: "还没有作品", action: createElement("a", { href: "/x" }, "新建作品") }));
  assert.match(markup, />还没有作品</);
  assert.match(markup, /href="\/x"/);
});

test("admin dates use dotted mono format and tolerate missing values", () => {
  assert.equal(formatAdminDate("2026-09-24T12:00:00.000Z"), "2026.09.24");
  assert.equal(formatAdminDate(null), "—");
  assert.equal(formatAdminDate("not a date"), "—");
});
```

同时把 `tests/admin-ui.test.ts` 顶部的 `AdminStatusBadge` import 删除。

- [ ] **Step 2: 运行确认失败** — `npx tsx --test tests/admin-ui.test.ts`，预期新测试 FAIL（模块不存在）。

- [ ] **Step 3: 实现**

`components/admin/admin-status.tsx`：

```tsx
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminStatusTone = "featured" | "ordinary" | "published" | "draft" | "dirty" | "saving" | "saved" | "error";

const text: Record<AdminStatusTone, string> = {
  featured: "text-admin-accent-text",
  dirty: "text-admin-accent-text",
  published: "text-admin-success-text",
  saved: "text-admin-success-text",
  error: "text-admin-danger",
  ordinary: "text-admin-fg-3",
  draft: "text-admin-fg-3",
  saving: "text-admin-fg-2",
};

const dot: Record<Exclude<AdminStatusTone, "saving">, string> = {
  featured: "bg-admin-accent",
  dirty: "bg-admin-accent",
  published: "bg-admin-success",
  saved: "bg-admin-success",
  error: "bg-admin-danger",
  ordinary: "border-[1.5px] border-admin-fg-3",
  draft: "border-[1.5px] border-admin-fg-3",
};

export function AdminStatus({ tone, children, className }: { tone: AdminStatusTone; children: ReactNode; className?: string }) {
  return (
    <span data-admin-status={tone} className={cn("inline-flex w-max items-center gap-1.5 text-xs leading-4", text[tone], className)}>
      {tone === "saving"
        ? <Loader2 aria-hidden="true" className="size-3 animate-spin motion-reduce:animate-none" />
        : <span aria-hidden="true" className={cn("size-[7px] shrink-0 rounded-full", dot[tone])} />}
      {children}
    </span>
  );
}
```

`components/admin/admin-page-header.tsx`：

```tsx
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

export type AdminPageHeaderProps = {
  title: string;
  subtitle: string;
  meta?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
};

export function AdminPageHeader({ title, subtitle, meta, actions, back }: AdminPageHeaderProps) {
  return (
    <header className="flex min-w-0 flex-col gap-4 pb-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 space-y-1.5">
        {back ? (
          <Link href={back.href} className="inline-flex items-center gap-1 rounded-sm text-xs text-admin-fg-2 transition-colors hover:text-admin-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent">
            <ArrowLeft aria-hidden="true" className="size-3.5" />{back.label}
          </Link>
        ) : null}
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 aria-label={subtitle} className="font-pixel text-[1.75rem] leading-none tracking-wide text-white">{title}</h1>
          <span aria-hidden="true" className="text-sm text-admin-fg-2">{subtitle}</span>
        </div>
        {meta ? <p className="font-admin-mono text-xs text-admin-fg-3">{meta}</p> : null}
      </div>
      {actions ? <div className="flex min-w-0 flex-wrap items-center gap-2 sm:shrink-0">{actions}</div> : null}
    </header>
  );
}
```

`components/admin/admin-filter-group.tsx`：

```tsx
"use client";

import { cn } from "@/lib/utils";

export type AdminFilterOption<T extends string> = { value: T; label: string; count?: number };

export function AdminFilterGroup<T extends string>({ label, value, options, onChange }: {
  label: string;
  value: T;
  options: Array<AdminFilterOption<T>>;
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-sm px-2.5 text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent",
              active ? "bg-admin-selected text-white" : "text-admin-fg-2 hover:bg-admin-raised hover:text-admin-fg",
            )}
          >
            {option.label}
            {option.count !== undefined ? <span className="font-admin-mono text-xs text-admin-fg-3">{option.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
```

`components/admin/admin-search.tsx`：

```tsx
"use client";

import { Search } from "lucide-react";

export function AdminSearch({ id, label, value, placeholder, onChange }: {
  id: string; label: string; value: string; placeholder: string; onChange: (value: string) => void;
}) {
  return (
    <div className="relative min-w-0">
      <label htmlFor={id} className="sr-only">{label}</label>
      <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-admin-fg-3" />
      <input
        id={id}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 w-full min-w-0 rounded-sm border border-admin-line-strong bg-admin-raised pr-2.5 pl-8 text-[13px] text-admin-fg placeholder:text-admin-fg-3 focus:border-admin-accent focus:outline-none"
      />
    </div>
  );
}
```

`components/admin/admin-empty-state.tsx`：

```tsx
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function AdminEmptyState({ icon: Icon, title, description, action }: {
  icon: LucideIcon; title: string; description?: string; action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg bg-admin-panel px-6 py-14 text-center">
      <Icon aria-hidden="true" className="size-6 text-admin-fg-3" />
      <p className="text-sm text-admin-fg">{title}</p>
      {description ? <p className="max-w-sm text-xs leading-5 text-admin-fg-3">{description}</p> : null}
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
```

`components/admin/admin-toolbar.tsx`：

```tsx
import type { ReactNode } from "react";

export function AdminToolbar({ filters, search, actions }: { filters: ReactNode; search?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-lg bg-admin-panel p-1.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-1">{filters}</div>
      {search || actions ? (
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          {search ? <div className="min-w-0 flex-1 sm:w-60 sm:flex-none">{search}</div> : null}
          {actions ? <div className="flex shrink-0 items-center gap-1.5">{actions}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
```

`components/admin/admin-form-section.tsx`：

```tsx
import type { ReactNode } from "react";

export function AdminFormSection({ index, title, description, children }: { index: string; title: string; description?: string; children: ReactNode }) {
  return (
    <section className="min-w-0 space-y-4 border-t border-admin-line pt-6 first:border-t-0 first:pt-0">
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span className="font-admin-mono text-xs text-admin-fg-3">{index}</span>
        <h2 className="text-sm font-medium text-admin-fg">{title}</h2>
        {description ? <p className="text-xs text-admin-fg-3">{description}</p> : null}
      </div>
      <div className="min-w-0 space-y-4">{children}</div>
    </section>
  );
}
```

`lib/admin-navigation.ts` 追加：

```ts
export function formatAdminDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}
```

临时适配（使旧页面仍能编译，后续任务重写）：各文件 `AdminStatusBadge` → `AdminStatus`，tone 映射 `neutral→ordinary`、`featured→featured`、`published→published`、`draft→draft`、`success→saved`、`danger→error`；`AdminFormSection` 调用补 `index`（按出现顺序 `"01"`…）并删 `layout` 属性；`AdminPageHeader` 调用把中文 `title` 改为 `title="<英文>" subtitle="<中文>"`，`status` → `meta`，`description` 删去。删除 `components/admin/admin-status-badge.tsx`。

- [ ] **Step 4: 运行** — `npx tsx --test tests/admin-ui.test.ts && npx tsc --noEmit`，预期 PASS。其余测试文件里对 `AdminStatusBadge` 的源码断言会失败，在对应页面任务中改。
- [ ] **Step 5: 提交** — `feat(admin): add shared edit-suite primitives`

---

### Task 3: 外壳与登录页

**Files:**
- Modify: `components/admin/admin-shell.tsx`
- Rewrite: `app/(admin)/login/page.tsx`
- Modify: `lib/admin-navigation.ts`（`isAdminPath`）
- Test: `tests/admin-works.test.ts`（`isAdminPath` 用例）、`tests/admin-ui.test.ts`

**Interfaces:**
- Consumes: Task 1 token 类、`data-admin-theme`。
- Produces: 侧栏宽 `--admin-sidebar-width: 12.5rem`；移动顶栏高 `h-14`（编辑器吸顶 `top-14` 依赖它）。

- [ ] **Step 1: 改测试**
  - `tests/admin-works.test.ts`：`assert.equal(isAdminPath("/login"), false);` → `true`。
  - `tests/admin-ui.test.ts` 新增：

```ts
test("admin surfaces opt into the edit-suite theme and the login page hides public chrome", () => {
  const shell = readFileSync(new URL("../components/admin/admin-shell.tsx", import.meta.url), "utf8");
  const login = readFileSync(new URL("../app/(admin)/login/page.tsx", import.meta.url), "utf8");
  assert.match(shell, /data-admin-theme/);
  assert.match(shell, /font-pixel/);
  assert.match(shell, /aria-label="查看网站"/);
  assert.match(shell, /aria-label="退出登录"/);
  assert.match(login, /data-admin-theme/);
  assert.match(login, /autoComplete="username"/);
  assert.match(login, /autoComplete="current-password"/);
  assert.match(login, /role="alert"/);
  assert.match(login, /signIn\("credentials"/);
});
```

- [ ] **Step 2: 运行确认失败** — `npx tsx --test tests/admin-ui.test.ts tests/admin-works.test.ts`。

- [ ] **Step 3: 实现**
  - `isAdminPath` 增加 `pathname === "/login" ||`。
  - `admin-shell.tsx`（逻辑部分：`AdminNavigationGuardProvider`、`useAdminNavigationGuard`、`useGuardedNavigation`、抽屉开关与焦点归还 **原样保留**），界面改为：
    - 根：`<div data-admin-theme className="min-h-screen bg-admin-canvas text-admin-fg [--admin-sidebar-width:12.5rem]">`。
    - 桌面 `aside`：`fixed inset-y-0 left-0 z-30 hidden w-[var(--admin-sidebar-width)] flex-col border-r border-admin-line bg-admin-panel px-2.5 py-4 md:flex`。
    - `AdminBrand`：`<span className="block font-pixel text-[1.2rem] leading-none text-white">nonacola3</span><span className="mt-1 block text-xs text-admin-fg-3">管理后台</span>`，`aria-label="nonacola3 管理后台首页"`。
    - 分组标题：`px-2.5 text-xs text-admin-fg-3`，组间 `gap-4`。
    - 导航项：`relative flex h-[34px] items-center gap-2.5 rounded-sm px-2.5 text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent`；选中 `bg-admin-selected text-white shadow-[inset_2px_0_0_var(--admin-accent)]`，图标 `text-admin-fg`；非选中 `text-admin-fg-2 hover:bg-admin-raised hover:text-admin-fg`，图标 `text-admin-fg-3`。图标：works `Clapperboard`、news `Newspaper`、settings `PanelsTopLeft`、media `Images`。
    - `AdminAccount`：一行 `flex items-center gap-2 border-t border-admin-line px-2.5 pt-3`：首字母方块 `grid size-7 place-items-center rounded-sm bg-admin-selected text-xs`（`userName?.[0]?.toUpperCase() ?? "A"`）、`<span className="min-w-0 flex-1 truncate text-[13px]">{userName ?? "Admin"}</span>`、「查看网站」`Link`（`ExternalLink` 图标，`aria-label="查看网站" title="查看网站"`，保留 `onClick={handleNavigation}`）、退出 `form`（`LogOut` 图标按钮 `aria-label="退出登录" title="退出登录"`，保留 `onSubmit={handleSignOut}`）。图标按钮 `grid size-8 place-items-center rounded-sm text-admin-fg-3 hover:bg-admin-raised hover:text-admin-fg`。
    - 移动 `header`：`sticky top-0 z-20 flex h-14 items-center justify-between border-b border-admin-line bg-admin-panel/95 px-4 backdrop-blur md:hidden`。抽屉 `DialogContent` 类改为 `bg-admin-panel border-admin-line text-admin-fg`，账号块位置不变。
    - `main`：`min-w-0 px-4 py-6 md:ml-[var(--admin-sidebar-width)] md:px-6 md:py-8 lg:px-8`（保持 admin-ui 的 gutter 测试）。
  - `app/(admin)/login/page.tsx` 重写（逻辑保持 `signIn("credentials", { username, password, redirect: false })`，失败 `setError("用户名或密码错误")`，成功 `router.push("/dashboard")`）：

```tsx
return (
  <main data-admin-theme className="grid min-h-screen place-items-center bg-admin-canvas px-4 text-admin-fg">
    <form onSubmit={handleSubmit} className="w-full max-w-[22.5rem] space-y-4 rounded-lg border border-admin-line bg-admin-panel p-6" aria-labelledby="login-title">
      <div className="space-y-1.5 pb-2">
        <p className="font-pixel text-2xl leading-none text-white">nonacola3</p>
        <h1 id="login-title" className="text-xs text-admin-fg-3">管理后台登录</h1>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="username" className="text-xs text-admin-fg-2">用户名</Label>
        <Input id="username" autoFocus autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} className="h-9" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-xs text-admin-fg-2">密码</Label>
        <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-9" />
      </div>
      {error ? <p role="alert" className="flex items-center gap-1.5 text-xs text-admin-danger"><CircleAlert aria-hidden="true" className="size-3.5" />{error}</p> : null}
      <Button type="submit" className="h-9 w-full" disabled={loading}>{loading ? "登录中…" : "登录"}</Button>
    </form>
  </main>
);
```

  （删除 `Card` 相关 import；`CircleAlert` 来自 lucide-react。）

- [ ] **Step 4: 运行** — `npx tsx --test tests/admin-ui.test.ts tests/admin-works.test.ts tests/portfolio-navigation.test.ts && npx tsc --noEmit`。
- [ ] **Step 5: 提交** — `feat(admin): restyle shell and login as edit suite`

---

### Task 4: 作品列表、排序页、列表骨架

**Files:**
- Rewrite: `components/admin/works-list.tsx`、`components/admin/work-order-editor.tsx`（界面层）
- Modify: `app/(admin)/dashboard/works/order/page.tsx`、`app/(admin)/dashboard/loading.tsx`
- Test: `tests/admin-works.test.ts`、`tests/admin-ui.test.ts`

**Interfaces:**
- Consumes: `AdminPageHeader`、`AdminToolbar`、`AdminFilterGroup`、`AdminSearch`、`AdminEmptyState`、`AdminStatus`、`formatAdminDate`、`filterAdminWorks(works, query, featuredOnly)`（不变）。

- [ ] **Step 1: 改测试**（`tests/admin-works.test.ts`）

```ts
test("Works uses linked identity, status dots, and a mobile-safe list", () => {
  const source = readFileSync(resolve(process.cwd(), "components/admin/works-list.tsx"), "utf8");
  assert.match(source, /AdminStatus\b/);
  assert.match(source, /href={`\/dashboard\/works\/\$\{work\.id\}\/edit`}/);
  assert.match(source, /data-admin-work-row/);
  assert.match(source, /w-\[7rem\]/);            // 112px 缩略图
  assert.match(source, /min-w-0[^"]*"[\s\S]*truncate/); // 标题可截断
  assert.match(source, /formatAdminDate\(work\.updatedAt\)/);
  assert.match(source, /没有匹配/);
  assert.doesNotMatch(source, /min-w-\[760px\]/);
});

test("Works ordering retains accessible movement and an explicit save-order action", () => {
  const source = readFileSync(resolve(process.cwd(), "components/admin/work-order-editor.tsx"), "utf8");
  assert.match(source, /aria-label={`上移 \$\{work\?\.title/);
  assert.match(source, /aria-label={`下移 \$\{work\?\.title/);
  assert.match(source, /保存排序/);
  assert.match(source, /padStart\(2, "0"\)/);
  assert.match(source, /bg-admin-accent/); // 插入线
});
```

`tests/admin-ui.test.ts` 的 DashboardLoading 测试保持（`role="status"`、5 个 `<li>`、无 `min-h-screen`）。

- [ ] **Step 2: 运行确认失败** — `npx tsx --test tests/admin-works.test.ts`。

- [ ] **Step 3: 实现**
  - `works-list.tsx`：状态、删除逻辑不变。结构：
    - `AdminPageHeader title="WORKS" subtitle="作品" meta={`${works.length} 个作品 · ${featuredCount} 个精选`} actions={<Link href="/dashboard/works/new" className={primaryLinkClass}><Plus/>新建作品</Link>}`，`primaryLinkClass = "inline-flex h-8 items-center gap-1.5 rounded-sm bg-admin-accent px-3 text-[13px] font-medium text-admin-accent-fg transition-colors hover:bg-[#ff6d38] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"`。
    - `AdminToolbar filters={<AdminFilterGroup label="作品筛选" value={featuredOnly ? "featured" : "all"} options={[{value:"all",label:"全部",count:works.length},{value:"featured",label:"精选",count:featuredCount}]} onChange={(v) => setFeaturedOnly(v === "featured")} />} search={<AdminSearch id="works-search" label="搜索作品" placeholder="搜索标题或分类" value={query} onChange={setQuery} />} actions={<Link href="/dashboard/works/order" className={secondaryLinkClass}><ArrowDownUp/>调整顺序</Link>}`，`secondaryLinkClass = "inline-flex h-8 items-center gap-1.5 rounded-sm border border-admin-line-strong bg-admin-raised px-2.5 text-[13px] text-admin-fg transition-colors hover:bg-admin-selected focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent"`。
    - 外层 `mx-auto max-w-[75rem] space-y-4`。
    - 空：`AdminEmptyState icon={Film} title="还没有作品" description="新建第一个作品后会出现在这里。" action={新建作品链接}`；筛选无结果：`AdminEmptyState icon={SearchX} title={query ? `没有匹配「${query}」的作品` : "没有精选作品"} action={<Button variant="outline" size="sm" onClick={() => { setQuery(""); setFeaturedOnly(false); }}>清除筛选</Button>}`。
    - 列表 `<ul className="space-y-1">`，行 `<li data-admin-work-row className="group grid min-w-0 grid-cols-[6rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-sm p-2 transition-colors hover:bg-admin-raised sm:grid-cols-[7rem_minmax(0,1fr)_auto] lg:grid-cols-[7rem_minmax(0,1fr)_5.5rem_6.5rem_auto] lg:gap-x-4">`：
      - 缩略图链接 `row-span-2 block aspect-video w-[6rem] overflow-hidden rounded-[3px] bg-admin-raised sm:w-[7rem] lg:row-span-1`，缺图时 `<span className="grid size-full place-items-center"><Film className="size-5 text-admin-fg-3"/></span>`。
      - 标题链接 `min-w-0`：`<span className="block truncate text-sm text-admin-fg">{work.title}</span><span className="mt-1 block truncate font-admin-mono text-xs text-admin-fg-3">{[work.category, work.role, work.tools].filter(Boolean).join(" · ")}</span>`。
      - 状态：`<div className="col-start-2 row-start-2 lg:col-auto lg:row-auto"><AdminStatus tone={work.featured ? "featured" : "ordinary"}>{work.featured ? "精选" : "普通"}</AdminStatus></div>`。
      - 日期：`<time className="hidden font-admin-mono text-xs text-admin-fg-3 lg:block" dateTime={work.updatedAt} title="最后更新">{formatAdminDate(work.updatedAt)}</time>`。
      - 操作：`col-start-3 row-span-2 row-start-1 flex items-center justify-end gap-0.5 lg:col-auto lg:row-span-1 lg:row-auto`；预览链接 `hidden sm:inline-flex size-8 … text-admin-fg-3 hover:text-admin-fg group-hover:text-admin-fg-2`，`aria-label={`预览 ${work.title}`}`；⋯ 菜单含「在新窗口预览」（`MenuLinkItem href={`/works/${work.id}`} target="_blank"`，`sm:hidden`）与「删除作品」（`text-admin-danger data-[highlighted]:bg-admin-danger/10`）。
  - `work-order-editor.tsx`：reducer/保存/拖拽逻辑不变；`worksById` 取缩略图。行：`grid grid-cols-[auto_auto_4.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-sm p-2 hover:bg-admin-raised sm:grid-cols-[auto_auto_5rem_minmax(0,1fr)_auto_auto]`；序号 `<span className="w-7 text-center font-admin-mono text-xs text-admin-fg-3" aria-label={`当前排序 ${item.order}`}>{String(index + 1).padStart(2, "0")}</span>`；精选改为 `Switch`（`aria-label={`${title} 设为精选`}`）加 `AdminStatus`；插入线 `bg-admin-accent`；上/下移按钮保留原 `aria-label`；吸底保存条 `border-t border-admin-line bg-admin-panel/95`，左 `<AdminStatus tone="dirty">排序有未保存的更改</AdminStatus>`，右「取消」`variant="ghost"` 与主按钮「保存排序」/「重试保存排序」。错误条 `rounded-sm border border-admin-danger/30 bg-admin-danger/10 text-admin-danger`。空状态用 `AdminEmptyState icon={ArrowDownUp} title="还没有可排序的作品"`。
  - `works/order/page.tsx`：`<div className="mx-auto max-w-[60rem] space-y-4"><AdminPageHeader title="ORDER" subtitle="调整顺序" meta={`${initialWorks.length} 个作品`} back={{ href: "/dashboard/works", label: "返回作品" }} /><WorkOrderEditor … /></div>`。
  - `dashboard/loading.tsx`：保持 `role="status"` 与 5 个 `<li>`；形状改为页头块（`h-7 w-28 bg-admin-raised`）、工具栏条（`h-11 rounded-lg bg-admin-panel`）、行（`h-[4.75rem] rounded-sm`，内含 `w-[7rem] aspect-video bg-admin-raised`）。

- [ ] **Step 4: 运行** — `npx tsx --test tests/admin-works.test.ts tests/admin-ui.test.ts && npx tsc --noEmit`。
- [ ] **Step 5: 提交** — `feat(admin): rebuild works list and ordering`

---

### Task 5: News 列表与类型选择页

**Files:**
- Rewrite: `components/admin/news-list.tsx`（界面层）
- Modify: `app/(admin)/dashboard/news/new/page.tsx`
- Test: `tests/admin-news.test.ts`

**Interfaces:**
- Consumes: `filterAdminPosts(posts, filter, query)`、`getPostKind(post)`、`reduceNewsListState`（均不变）；共享组件同 Task 4。

- [ ] **Step 1: 改测试**（`tests/admin-news.test.ts`）
  - 「AdminStatusBadge」断言 → `assert.match(source, /AdminStatus\b/)`；新增 `assert.match(source, /FileText/); assert.match(source, /MessageCircle/); assert.doesNotMatch(source, />\{kind === "article" \? "文章" : "短动态"\}<\/AdminStatus/);`（类型不再用状态徽标）以及 `assert.match(source, /sr-only">\{kind === "article" \? "文章" : "短动态"\}/);`。
  - 新建页断言 `title="新建内容"` → `subtitle="新建内容"`，并 `assert.match(newPage, /title="NEW"/)`。
  - 预览 aria-label 的渲染测试（草稿无预览、已发布有 `aria-label="预览 Published article"`）保持不变。

- [ ] **Step 2: 运行确认失败** — `npx tsx --test tests/admin-news.test.ts`。

- [ ] **Step 3: 实现**
  - 页头 `title="NEWS" subtitle="动态与文章" meta={`${posts.length} 条 · ${publishedCount} 已发布 · ${draftCount} 草稿`}`；主操作 `Menu`：触发器用 Task 4 的 `primaryLinkClass` 样式，文字 `<Plus/>新建<ChevronDown/>`，菜单项 `MenuLinkItem href="/dashboard/news/new?type=short"`「短动态」（`MessageCircle` 图标）与 `?type=article`「Markdown 文章」（`FileText` 图标）。
  - 工具栏：`AdminFilterGroup label="内容筛选"` 选项 全部/已发布/草稿 带数量；`AdminSearch id="news-search" label="搜索内容" placeholder="搜索标题或正文"`。
  - 空状态：无内容 `AdminEmptyState icon={Newspaper} title="还没有动态或文章" action={新建短动态链接}`；无结果同 Task 4 模式「没有匹配「…」的内容」+ 清除筛选。
  - 行（`<ul aria-label="News 内容列表" className="space-y-1">`）：`grid min-w-0 grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-sm p-2 hover:bg-admin-raised lg:grid-cols-[2rem_minmax(0,1fr)_6rem_5rem_6.5rem_4.5rem] lg:gap-x-4`：
    - 类型方块 `row-span-2 grid size-8 place-items-center rounded-sm bg-admin-raised text-admin-fg-3 lg:row-span-1`，图标 `FileText`/`MessageCircle` + `<span className="sr-only">{kind === "article" ? "文章" : "短动态"}</span>`。
    - 标题链接（保持 `aria-label={`编辑 ${content}`}`）：`<span className="block truncate text-sm text-admin-fg">{content}</span>`；文章第二行 `<span className="mt-0.5 block truncate text-xs text-admin-fg-3">{post.body}</span>`。
    - 标签 `hidden truncate text-xs text-admin-fg-2 lg:block`（无标签 `—`）。
    - 状态 `col-start-2 row-start-2 lg:col-auto lg:row-auto`：`AdminStatus tone={post.published ? "published" : "draft"}`。
    - 日期 `hidden font-admin-mono text-xs text-admin-fg-3 lg:block`：`formatAdminDate(post.createdAt)`。
    - 操作：已发布显示预览链接（`aria-label={`预览 ${content}`}` 保持）；⋯ 菜单「发布 / 转为草稿」、分隔线、「删除内容」（`text-admin-danger`）。
    - 外层 `mx-auto max-w-[75rem] space-y-4`。
  - `news/new/page.tsx`：短路返回编辑器的两处不变；选择页改为 `AdminPageHeader title="NEW" subtitle="新建内容" back={{ href: "/dashboard/news", label: "返回 News" }}`，两块瓦片 `choiceClassName = "flex min-h-32 flex-col gap-2 rounded-lg bg-admin-panel p-5 outline-none transition-colors hover:bg-admin-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent"`，图标 `MessageCircle` / `FileText`（`text-admin-accent`）。

- [ ] **Step 4: 运行** — `npx tsx --test tests/admin-news.test.ts && npx tsc --noEmit`。
- [ ] **Step 5: 提交** — `feat(admin): rebuild news list with type icons`

---

### Task 6: 媒体来源识别、选择器弹窗、MediaField

**Files:**
- Create: `lib/admin-media-source.ts`、`components/admin/media-field.tsx`
- Rewrite: `components/admin/media-picker.tsx`
- Test: `tests/admin-media-source.test.ts`（新）、`tests/admin-ui.test.ts`

**Interfaces:**
- Produces:

```ts
export type MediaSourceKind = "empty" | "library-image" | "library-video" | "library-file" | "bilibili" | "youtube" | "local" | "external";
export type MediaSource = { kind: MediaSourceKind; name: string; detail: string };
export function describeMediaSource(value: string): MediaSource;
```

  - `MediaPickerDialog({ kind: "image" | "video"; accept?: string; open: boolean; onOpenChange: (open: boolean) => void; value: string; onSelect: (url: string) => void })` —— 弹窗内加载 `/api/blob-usage`、按 `filterMediaPickerFiles` 过滤、可上传；当前值橙色描边 + 「当前」。
  - `useMediaUpload({ kind: "image" | "video"; accept?: string; label: string; onUploaded: (url: string) => void })` → `{ input: ReactNode; openFilePicker: () => void; uploading: boolean; progress: number; error: string | null }` —— 隐藏的 `<input type="file">` 由调用方渲染在菜单之外，菜单项点击时调用 `openFilePicker()`。
  - `MediaUploadButton({ kind; label: string; accept?: string; disabled?: boolean; onUploaded: (url: string) => void; className?: string })` —— 基于 `useMediaUpload` 的按钮版本。上传实现与现在相同（`@vercel/blob/client` 的 `upload`，`handleUploadUrl: "/api/blob-token"`，同样的 MIME 校验与 `safeName`），抽为模块内函数 `uploadMediaFile(file, kind, accept, onProgress): Promise<string>`，供 hook 与选择器弹窗共用。
  - `filterMediaPickerFiles` 导出保持不变。
  - `MediaField({ id: string; label: string; kind: "image" | "video"; value: string; onChange: (url: string) => void; accept?: string; optional?: boolean; allowEmbed?: boolean; disabled?: boolean; size?: "compact" | "large"; badge?: ReactNode; description?: ReactNode; previewPoster?: string; actions?: ReactNode })`。

- [ ] **Step 1: 写失败测试** `tests/admin-media-source.test.ts`

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { describeMediaSource } from "../lib/admin-media-source";

const blob = "https://kq4mwotlyfyzycmp.public.blob.vercel-storage.com/uploads";

test("empty and whitespace values are unset", () => {
  assert.deepEqual(describeMediaSource(""), { kind: "empty", name: "未设置", detail: "" });
  assert.equal(describeMediaSource("   ").kind, "empty");
});

test("library files are recognised by host and extension, keeping the readable filename", () => {
  assert.deepEqual(describeMediaSource(`${blob}/work-image-1788-numb.webp`), { kind: "library-image", name: "work-image-1788-numb.webp", detail: "媒体库" });
  assert.equal(describeMediaSource(`${blob}/hero-720p.mp4?download=1`).kind, "library-video");
  assert.equal(describeMediaSource(`${blob}/hero-720p.mp4?download=1`).name, "hero-720p.mp4");
  assert.equal(describeMediaSource(`${blob}/notes.pdf`).kind, "library-file");
  assert.equal(describeMediaSource(`${blob}/%E5%B0%81%E9%9D%A2.png`).name, "封面.png");
});

test("Bilibili links, player URLs and pasted iframe code are all Bilibili", () => {
  const expected = { kind: "bilibili", name: "Bilibili · BV1Vz8E6WEd6", detail: "嵌入链接" };
  assert.deepEqual(describeMediaSource("https://www.bilibili.com/video/BV1Vz8E6WEd6/"), expected);
  assert.deepEqual(describeMediaSource("//player.bilibili.com/player.html?bvid=BV1Vz8E6WEd6&page=1"), expected);
  assert.deepEqual(describeMediaSource('<iframe src="//player.bilibili.com/player.html?bvid=BV1Vz8E6WEd6" allowfullscreen></iframe>'), expected);
  assert.equal(describeMediaSource("https://b23.tv/abc123").kind, "bilibili");
});

test("YouTube watch, short and embed links expose the video id", () => {
  for (const url of ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "https://youtu.be/dQw4w9WgXcQ", "https://www.youtube.com/embed/dQw4w9WgXcQ"]) {
    assert.deepEqual(describeMediaSource(url), { kind: "youtube", name: "YouTube · dQw4w9WgXcQ", detail: "嵌入链接" });
  }
});

test("site-relative files, other hosts and unparseable text never throw", () => {
  assert.deepEqual(describeMediaSource("/hero-poster.webp"), { kind: "local", name: "hero-poster.webp", detail: "站内文件" });
  assert.deepEqual(describeMediaSource("https://vimeo.com/123"), { kind: "external", name: "vimeo.com", detail: "外部链接" });
  assert.deepEqual(describeMediaSource("not a url"), { kind: "external", name: "not a url", detail: "外部链接" });
});
```

并在 `tests/admin-ui.test.ts` 替换「media library upload actions name the file type…」为：

```ts
test("media upload buttons name the file type and offer a direct file input", () => {
  const markup = renderToStaticMarkup(createElement(MediaUploadButton, { kind: "image", label: "上传图片", onUploaded: () => {} }));
  assert.match(markup, />上传图片</);
  assert.match(markup, /type="file"/);
});

test("media fields show one slot per value with the raw address hidden until requested", () => {
  const empty = renderToStaticMarkup(createElement(MediaField, { id: "t", label: "缩略图", kind: "image", value: "", onChange: () => {}, optional: true }));
  assert.match(empty, /未设置/);
  assert.match(empty, /从媒体库选择/);
  assert.match(empty, /编辑地址/);
  assert.doesNotMatch(empty, /<input[^>]*type="url"/);

  const embed = renderToStaticMarkup(createElement(MediaField, { id: "v", label: "作品视频", kind: "video", value: "https://www.bilibili.com/video/BV1Vz8E6WEd6/", onChange: () => {}, allowEmbed: true }));
  assert.match(embed, /Bilibili · BV1Vz8E6WEd6/);
  assert.equal((embed.match(/BV1Vz8E6WEd6/g) ?? []).length, 1);

  const library = renderToStaticMarkup(createElement(MediaField, { id: "i", label: "缩略图", kind: "image", value: "https://x.public.blob.vercel-storage.com/a.webp", onChange: () => {}, optional: true }));
  assert.match(library, /<img[^>]*src="https:\/\/x\.public\.blob\.vercel-storage\.com\/a\.webp"/);
  assert.match(library, />清除</);
});
```

（import：`import { MediaUploadButton } from "../components/admin/media-picker"; import { MediaField } from "../components/admin/media-field";`，删除旧 `MediaPicker` import。）

- [ ] **Step 2: 运行确认失败** — `npx tsx --test tests/admin-media-source.test.ts tests/admin-ui.test.ts`。

- [ ] **Step 3: 实现** `lib/admin-media-source.ts`

```ts
export type MediaSourceKind = "empty" | "library-image" | "library-video" | "library-file" | "bilibili" | "youtube" | "local" | "external";
export type MediaSource = { kind: MediaSourceKind; name: string; detail: string };

const IMAGE_EXTENSION = /\.(jpe?g|png|webp|gif|avif|svg)$/i;
const VIDEO_EXTENSION = /\.(mp4|webm|mov|avi|m4v|ogv)$/i;
const LIBRARY_HOST_SUFFIX = ".blob.vercel-storage.com";

function lastSegment(pathname: string): string {
  const segment = pathname.split("/").filter(Boolean).pop() ?? pathname;
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export function describeMediaSource(value: string): MediaSource {
  let raw = value.trim();
  if (!raw) return { kind: "empty", name: "未设置", detail: "" };

  const iframeSrc = raw.match(/src=["']([^"']+)["']/)?.[1];
  if (iframeSrc) raw = iframeSrc;
  if (raw.startsWith("//")) raw = `https:${raw}`;

  if (raw.startsWith("/")) {
    return { kind: "local", name: lastSegment(raw.split(/[?#]/, 1)[0] ?? raw), detail: "站内文件" };
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { kind: "external", name: raw, detail: "外部链接" };
  }

  const host = url.hostname.toLowerCase();

  if (host.endsWith(LIBRARY_HOST_SUFFIX)) {
    const name = lastSegment(url.pathname);
    const kind = VIDEO_EXTENSION.test(name) ? "library-video" : IMAGE_EXTENSION.test(name) ? "library-image" : "library-file";
    return { kind, name, detail: "媒体库" };
  }

  if (host === "b23.tv" || host.endsWith("bilibili.com")) {
    const bvid = url.pathname.match(/\/video\/(BV[a-zA-Z0-9]+)/)?.[1] ?? url.searchParams.get("bvid");
    return { kind: "bilibili", name: bvid ? `Bilibili · ${bvid}` : `Bilibili · ${host}${url.pathname}`, detail: "嵌入链接" };
  }

  if (host === "youtu.be" || host.endsWith("youtube.com")) {
    const id = host === "youtu.be"
      ? url.pathname.split("/").filter(Boolean)[0]
      : url.searchParams.get("v") ?? url.pathname.match(/\/embed\/([^/?]+)/)?.[1];
    if (id) return { kind: "youtube", name: `YouTube · ${id}`, detail: "嵌入链接" };
  }

  return { kind: "external", name: host, detail: "外部链接" };
}
```

`components/admin/media-picker.tsx`：保留 `BlobFile`、`filterMediaPickerFiles`、扩展名/MIME 表；新增 `uploadMediaFile`（从现 `handleUpload` 抽出，失败抛 `Error`）；
- `MediaUploadButton`：隐藏 `<input type="file" className="hidden" tabIndex={-1} aria-label={label} accept=…>` + `Button variant="outline" size="sm"`（上传中显示 `Loader2` 与 `上传中 {progress}%`），错误 `role="alert"` 红字。
- `MediaPickerDialog`：`open` 变为 `true` 时加载文件；`DialogContent className="max-h-[80vh] max-w-3xl rounded-lg bg-admin-panel sm:max-w-3xl"`；标题「选择图片/选择视频」，描述「从媒体库选择，或上传新文件。」；顶部上传按钮 + 橙色进度条（`bg-admin-accent`）；网格 `grid grid-cols-2 gap-2 sm:grid-cols-3`，每项 `button` `rounded-sm bg-admin-raised text-left ring-1 ring-transparent hover:ring-admin-line-strong`，当前值 `ring-2 ring-admin-accent` 并在预览左上角 `当前` 标签（`bg-admin-accent text-admin-accent-fg`）；文件名 `truncate font-admin-mono text-xs`，大小 `font-admin-mono text-xs text-admin-fg-3`。加载/错误/空三态保持现文案。上传中禁止关闭（`onOpenChange(false)` 在 `uploading` 时忽略）。

`components/admin/media-field.tsx`（`"use client"`）：

```tsx
export function MediaField({ id, label, kind, value, onChange, accept, optional = false, allowEmbed = false, disabled = false, size = "compact", badge, description, previewPoster, actions }: MediaFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const source = describeMediaSource(value);
  const large = size === "large";
  return (
    <div className="min-w-0 space-y-1.5">
      <div className="flex items-center gap-2"><span id={`${id}-label`} className="text-xs text-admin-fg-2">{label}</span>{badge}</div>
      <div className={cn("grid min-w-0 items-center gap-3 rounded-md bg-admin-panel p-2", large ? "sm:grid-cols-[12.5rem_minmax(0,1fr)] sm:gap-4" : "grid-cols-[8rem_minmax(0,1fr)]")}>
        <MediaPreview source={source} url={value} kind={kind} poster={previewPoster} large={large} />
        <div className="min-w-0 space-y-2">
          <div className="min-w-0">
            <p className="truncate font-admin-mono text-xs text-admin-fg" title={value || undefined}>{source.name}</p>
            {description ?? (source.detail ? <p className="text-xs text-admin-fg-3">{source.detail}</p> : null)}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => setPickerOpen(true)} aria-describedby={`${id}-label`}>{value ? "更换" : "从媒体库选择"}</Button>
            <Button type="button" size="sm" variant="outline" disabled={disabled} aria-expanded={editing} aria-controls={`${id}-url`} onClick={() => setEditing((v) => !v)}>编辑地址</Button>
            {optional && value ? <Button type="button" size="sm" variant="ghost" disabled={disabled} onClick={() => onChange("")}>清除</Button> : null}
            {actions}
          </div>
          {editing ? (
            <Input id={`${id}-url`} aria-labelledby={`${id}-label`} type="url" value={value} disabled={disabled} placeholder={allowEmbed ? "粘贴 Bilibili / YouTube 链接或文件地址" : "https://…"} onChange={(event) => onChange(event.target.value)} className="h-8 font-admin-mono text-xs" />
          ) : null}
        </div>
      </div>
      <MediaPickerDialog kind={kind} accept={accept} open={pickerOpen} onOpenChange={setPickerOpen} value={value} onSelect={(url) => { onChange(url); setPickerOpen(false); }} />
    </div>
  );
}
```

`MediaPreview`（同文件内）：外框 `relative aspect-video w-full overflow-hidden rounded-[3px] bg-admin-raised`；
- `empty`：`border border-dashed border-admin-line-strong bg-transparent` + `ImageOff` / `VideoOff` 图标；
- `library-image` / `local` 且 `kind==="image"`：`<img src={url} alt="" className="size-full object-cover" />`（eslint 注释同现有代码）；
- `library-video` / 视频 `local`：`<video src={url} poster={poster} muted playsInline preload="metadata" className="size-full object-cover" />`。`large` 时：未播放状态不显示原生控件，中间覆盖播放按钮（`aria-label="播放预览"`），右下角 `onLoadedMetadata` 得到的时长以 `font-admin-mono text-xs` 显示为 `mm:ss`；点击后设置 `playing` 状态、打开 `controls` 并调用 `play()`（失败则保持 `controls` 可见）。时长格式由同文件导出的 `formatMediaDuration(seconds: number): string` 生成（`53 → "00:53"`，`125.4 → "02:05"`，非有限值 → `""`），在 Task 6 测试中加用例：`assert.equal(formatMediaDuration(53), "00:53"); assert.equal(formatMediaDuration(125.4), "02:05"); assert.equal(formatMediaDuration(Number.NaN), "");`。
- `bilibili`：`bg-[#1a2433]` + `<span className="font-admin-mono text-xs text-[#7fb4ff]">bilibili</span>`（lucide 无 B 站图标）；`youtube`：`Youtube` 图标；`external` / `library-file`：`Link2` / `File` 图标。
- 注：`MediaUploadButton` 与 `MediaPickerDialog` 需在服务端渲染（测试用 `renderToStaticMarkup`）时不访问 `window`。

- [ ] **Step 4: 运行** — `npx tsx --test tests/admin-media-source.test.ts tests/admin-ui.test.ts && npx tsc --noEmit`（此时 work-editor / page-settings / media-library 仍引用旧 `MediaPicker`，在本步把三处的旧调用临时改为：work-editor 用 `MediaField`（Task 7 会完善布局）、page-settings 用 `MediaField size="large"`、media-library 用 `MediaUploadButton`，以保证编译通过）。
- [ ] **Step 5: 提交** — `feat(admin): add media source detection and MediaField`

---

### Task 7: 编辑器

**Files:**
- Modify: `components/admin/admin-editor-header.tsx`、`work-editor.tsx`、`work-card-preview.tsx`、`article-editor.tsx`、`short-post-editor.tsx`
- Modify: `app/(admin)/dashboard/works/[id]/edit/page.tsx`、`works/new/page.tsx`、`news/[id]/edit/page.tsx`
- Test: `tests/admin-works.test.ts`、`tests/admin-news.test.ts`、`tests/admin-ui.test.ts`

**Interfaces:**
- Consumes: `AdminStatus`、`AdminFormSection({ index, title, description? })`、`MediaField`、原有 reducer/payload 函数（不变）。
- Produces: `AdminEditorHeader({ section: "WORKS" | "NEWS"; title: ReactNode; status: { tone: AdminStatusTone; label: string }; onBack: () => void; children: ReactNode })`。

- [ ] **Step 1: 改测试**
  - `tests/admin-works.test.ts`「Work editor has one action header…」改为：

```ts
test("Work editor has one action header, one media slot per field, and no editable order control", () => {
  const source = readFileSync(resolve(process.cwd(), "components/admin/work-editor.tsx"), "utf8");
  assert.match(source, /AdminEditorHeader/);
  assert.match(source, /AdminFormSection/);
  assert.doesNotMatch(source, /id="work-order"/);
  assert.equal((source.match(/保存并返回/g) ?? []).length, 1);
  assert.equal((source.match(/<WorkCardPreview\b/g) ?? []).length, 1);
  assert.equal((source.match(/<MediaField\b/g) ?? []).length, 2);
  assert.doesNotMatch(source, /id="work-embed-url"/);
  assert.doesNotMatch(source, /id="work-thumbnail"/);
  assert.match(source, /xl:sticky xl:top-24/);
  assert.match(source, /<details open/);
  const header = readFileSync(resolve(process.cwd(), "components/admin/admin-editor-header.tsx"), "utf8");
  assert.match(header, /sticky top-14/);
  assert.match(header, /md:top-0/);
  assert.match(header, /truncate/);
  assert.match(header, /aria-live="polite"/);
  const preview = readFileSync(resolve(process.cwd(), "components/admin/work-card-preview.tsx"), "utf8");
  assert.match(preview, /setViewport\("mobile"\)/);
  assert.match(preview, /setViewport\("desktop"\)/);
  assert.match(preview, /break-words/);
  for (const route of ["app/(admin)/dashboard/works/[id]/edit/page.tsx", "app/(admin)/dashboard/works/new/page.tsx", "app/(admin)/dashboard/news/[id]/edit/page.tsx"]) {
    assert.doesNotMatch(readFileSync(resolve(process.cwd(), route), "utf8"), /AdminPageHeader/, route);
  }
});
```

  - `tests/admin-ui.test.ts` 的「admin editors retain visible focus and mobile sticky offsets」保持（`top-14`、`md:top-0`、menu `focus:`/`outline-none`）。
  - `tests/admin-news.test.ts` 编辑器断言（`AdminEditorHeader`、`AdminFormSection`、`getPostEditorActions(state.intendedPublished)`）保持；编辑路由断言（`await params`、`notFound`、`post.title === null`、`serializeAdminPost`）保持。

- [ ] **Step 2: 运行确认失败** — `npx tsx --test tests/admin-works.test.ts`。

- [ ] **Step 3: 实现**
  - `admin-editor-header.tsx`：

```tsx
export function AdminEditorHeader({ section, title, status, onBack, children }: {
  section: "WORKS" | "NEWS"; title: ReactNode; status: { tone: AdminStatusTone; label: string }; onBack: () => void; children: ReactNode;
}) {
  return (
    <header className="sticky top-14 z-20 -mx-4 flex flex-col gap-3 border-b border-admin-line bg-admin-panel/95 px-4 py-2.5 backdrop-blur md:top-0 md:-mx-6 md:-mt-8 md:flex-row md:items-center md:justify-between md:px-6 lg:-mx-8 lg:px-8">
      <div className="flex min-w-0 items-center gap-2">
        <Button type="button" variant="ghost" size="icon" onClick={onBack} aria-label="返回" title="返回" className="shrink-0 text-admin-fg-2"><ArrowLeft aria-hidden="true" /></Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-admin-fg"><span className="mr-1.5 font-admin-mono text-xs text-admin-fg-3">{section} /</span>{title}</p>
          <div aria-live="polite"><AdminStatus tone={status.tone}>{status.label}</AdminStatus></div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-1.5">{children}</div>
    </header>
  );
}
```

  - 三个编辑器统一状态映射：`saving → { tone: "saving", label: "保存中…" }`，`error → { tone: "error", label: "保存失败" }`，`saved`（且不脏）`→ { tone: "saved", label: "已保存" }`，脏 `→ { tone: "dirty", label: "有未保存更改" }`，其余 `→ { tone: "ordinary", label: "所有更改已保存" }`；保留原 `statusText` 变量用于 sr-only 公告。错误提示条 `rounded-sm border border-admin-danger/30 bg-admin-danger/10 px-4 py-3 text-sm text-admin-danger`。
  - `work-editor.tsx`：保存/导航逻辑不变。头部按钮：`查看公开页面`（`variant="ghost"`，`ExternalLink`，`disabled={!workId}`）、`保存并返回`（`variant="outline"`）、`保存更改`（默认主按钮）。正文 `pt-6`，网格 `grid min-w-0 items-start gap-8 xl:grid-cols-[minmax(0,45rem)_minmax(20rem,23.75rem)] xl:justify-between`。分区：
    - `01 基本信息`：标题（全宽）；`grid gap-4 sm:grid-cols-2` 放分类、日期；精选行 `flex h-10 items-center justify-between rounded-sm bg-admin-panel px-3`。
    - `02 媒体`：`<MediaField id="work-video" label="作品视频" kind="video" allowEmbed value={state.form.embedUrl} onChange={(url) => setField("embedUrl", url)} />` 与 `<MediaField id="work-thumbnail-field" label="缩略图" kind="image" optional value={state.form.thumbnail} onChange={(url) => setField("thumbnail", url)} />`。
    - `03 卡片信息`：摘要 textarea（右下 `font-admin-mono text-xs text-admin-fg-3` 字数），`sm:grid-cols-2` 放职责、工具。
    - `04 Case Study`：`MarkdownEditor`（`id: "work-description", rows: 14`）。
    - 预览列：`<div className="min-w-0 xl:sticky xl:top-24"><details open className="group min-w-0 rounded-lg bg-admin-panel p-3"><summary className="cursor-pointer text-sm text-admin-fg xl:pointer-events-none xl:list-none">卡片预览</summary><div className="pt-3"><WorkCardPreview value={state.form} /></div></details></div>`。
    - textarea 类：`w-full rounded-sm border border-input bg-admin-raised px-2.5 py-2 text-sm text-admin-fg outline-none placeholder:text-admin-fg-3 focus-visible:border-admin-accent`。
  - `work-card-preview.tsx`：去掉内部重复的「卡片预览」标题，仅保留视口切换按钮行（右对齐，`aria-label="预览宽度"`）；卡片容器 `rounded-md bg-admin-canvas p-3`；其余结构与 `break-words` 保持。
  - `article-editor.tsx`：头部 `section="NEWS"`；标题输入 `className="h-12 w-full border-0 border-b border-admin-line bg-transparent px-0 text-[1.375rem] text-white outline-none placeholder:text-admin-fg-3 focus-visible:border-admin-accent"`（`<Label className="sr-only">标题</Label>`），标签输入 `max-w-xs`；`01 正文与预览` 分区 `grid gap-5 xl:grid-cols-2`；预览框 `rounded-md bg-admin-panel p-5`。按钮逻辑（`getPostEditorActions`）不变。
  - `short-post-editor.tsx`：外层 `mx-auto max-w-[40rem]`；textarea `text-base leading-7 min-h-56`，字数 `font-admin-mono`；标签在下方。
  - 路由页：`works/[id]/edit/page.tsx` 直接 `return <WorkEditor mode="edit" initialWork={initialWork} />;`；`works/new/page.tsx` `return <WorkEditor mode="create" />;`；`news/[id]/edit/page.tsx` 去掉 `AdminPageHeader` 与外层 div，其余不变。
  - 编辑器外层宽度：作品 `mx-auto max-w-[75rem]`，文章 `mx-auto max-w-[75rem]`。

- [ ] **Step 4: 运行** — `npx tsx --test tests/admin-works.test.ts tests/admin-news.test.ts tests/admin-ui.test.ts && npx tsc --noEmit`。
- [ ] **Step 5: 提交** — `feat(admin): streamline editors around MediaField`

---

### Task 8: 媒体库

**Files:**
- Modify: `components/admin/media-library.tsx`（界面层）、`components/admin/admin-media-skeleton.tsx`、`app/(admin)/dashboard/media/loading.tsx`
- Test: `tests/admin-media.test.ts`、`tests/admin-ui.test.ts`

**Interfaces:**
- Consumes: `MediaUploadButton`、`AdminFilterGroup`、`AdminSearch`、`AdminEmptyState`、`AdminStatus`、`filterMediaFiles`、`reduceMediaLibraryState`（不变）。

- [ ] **Step 1: 改测试**（`tests/admin-media.test.ts` 第 ~582 行附近）：`grid-cols-2`、`2xl:grid-cols-4` 断言替换为 `assert.match(source, /grid-cols-\[repeat\(auto-fill,minmax\(12\.5rem,1fr\)\)\]/);`；新增 `assert.match(source, /MediaUploadButton/); assert.match(source, /font-admin-mono/);`；保留 `AdminToolbar`、`title={file.pathname}`、`Hero 视频封面`、409 冲突文案、`isMediaReferences`、`role="status" aria-live="polite"`、`重新尝试删除` 等断言。`tests/admin-ui.test.ts` 的两个媒体骨架测试（`<article>` ≥ 3、`role="status"`）保持。
- [ ] **Step 2: 运行确认失败** — `npx tsx --test tests/admin-media.test.ts`。
- [ ] **Step 3: 实现**
  - 页头 `title="LIBRARY" subtitle="媒体库" meta={inventory ? `${inventory.count} 个文件 · ${inventory.totalSizeMB} MB` : "正在读取存储信息…"}`；主操作：两个 `useMediaUpload` 实例（`kind: "image", label: "上传图片"` 与 `kind: "video", label: "上传视频"`，`onUploaded: () => void loadInventory()`），把两者的 `input` 渲染在 `Menu` 外面；`Menu` 触发器为主按钮样式「<Upload/>上传<ChevronDown/>」（任一上传中时显示 `<Loader2/>上传中 {progress}%` 并禁用），两个 `MenuItem`「上传图片」「上传视频」分别调用对应 `openFilePicker()`；任一 `error` 显示在页头下方 `role="alert"` 红字。删除进行中时禁用触发器。
  - 工具栏：`AdminFilterGroup label="媒体筛选"`（全部/图片/视频/未使用，带数量：`state.files` 分别计数，未使用 = `references.length === 0`），`AdminSearch id="media-search" label="按文件名搜索" placeholder="按文件名搜索"`，actions 放刷新图标按钮（`RefreshCw`，`aria-label="刷新列表"`，`disabled` 条件同现在）。
  - 网格 `grid grid-cols-[repeat(auto-fill,minmax(12.5rem,1fr))] gap-3`；`MediaCard`：`article` `min-w-0 overflow-hidden rounded-lg bg-admin-panel`；预览 `aspect-video bg-admin-raised`；类型标 `absolute left-1.5 top-1.5 rounded-[3px] bg-black/70 px-1.5 text-[11px]`→ 字号不小于 12px：用 `text-xs`；信息区 `space-y-1.5 p-2.5`：文件名 `truncate font-admin-mono text-xs text-admin-fg`（`title={file.pathname}`），大小 `font-admin-mono text-xs text-admin-fg-3`；引用：`<p className="truncate text-xs text-admin-fg-2">使用中 · {labels.join("、")}</p>`（完整列表放 `title`），未使用：`flex justify-between` 左 `AdminStatus tone="draft"`「未使用」，右 `Button variant="ghost" size="sm" className="text-admin-danger"`「删除」（保持 `aria-label={`删除 ${file.pathname}`}`）。
  - 删除进行中、错误重试、成功公告、加载失败、空、无结果：文案与逻辑不变，外观换成 token（空与无结果用 `AdminEmptyState`）。
  - `admin-media-skeleton.tsx`：同网格类，6 个 `article`（`bg-admin-panel`），保留 `role="status"`、`aria-label="正在加载媒体库"`。`media/loading.tsx` 页头与工具栏占位换成 token 色。
- [ ] **Step 4: 运行** — `npx tsx --test tests/admin-media.test.ts tests/admin-ui.test.ts && npx tsc --noEmit`。
- [ ] **Step 5: 提交** — `feat(admin): rebuild media library grid`

---

### Task 9: 页面媒体与单项恢复

**Files:**
- Modify: `lib/admin-settings.ts`
- Rewrite: `components/admin/page-settings.tsx`（界面层）
- Modify: `app/(admin)/dashboard/settings/loading.tsx`
- Test: `tests/admin-settings.test.ts`

**Interfaces:**
- Produces: `SaveableSettingEvent<T>` 新增 `{ type: "revert-field"; field: keyof T }`（仅对象型 `T` 使用）；`change` 与 `revert-field` 之后若 `draft` 与 `saved` 深相等，`status` 为 `"clean"`。

- [ ] **Step 1: 写失败测试**（追加到 `tests/admin-settings.test.ts`）

```ts
test("reverting one slot restores only that field and returns to clean when nothing else changed", () => {
  const initial = createSaveableSettingState({ videoUrl: "old.mp4", posterUrl: "old.webp" });
  const both = reduceSaveableSettingState(initial, { type: "change", value: { videoUrl: "new.mp4", posterUrl: "new.webp" } });
  const posterReverted = reduceSaveableSettingState(both, { type: "revert-field", field: "posterUrl" });
  assert.deepEqual(posterReverted.draft, { videoUrl: "new.mp4", posterUrl: "old.webp" });
  assert.equal(posterReverted.status, "dirty");
  const allReverted = reduceSaveableSettingState(posterReverted, { type: "revert-field", field: "videoUrl" });
  assert.deepEqual(allReverted.draft, allReverted.saved);
  assert.equal(allReverted.status, "clean");
});

test("choosing the saved value again is not a pending change", () => {
  const initial = createSaveableSettingState({ videoUrl: "old.mp4", posterUrl: "old.webp" });
  const changed = reduceSaveableSettingState(initial, { type: "change", value: { videoUrl: "new.mp4", posterUrl: "old.webp" } });
  const back = reduceSaveableSettingState(changed, { type: "change", value: { videoUrl: "old.mp4", posterUrl: "old.webp" } });
  assert.equal(back.status, "clean");
  assert.equal(isSaveableSettingDirty(back), false);
});

test("revert is ignored while saving", () => {
  const saving = reduceSaveableSettingState(
    reduceSaveableSettingState(createSaveableSettingState({ videoUrl: "a", posterUrl: "b" }), { type: "change", value: { videoUrl: "c", posterUrl: "b" } }),
    { type: "save-start" },
  );
  assert.equal(reduceSaveableSettingState(saving, { type: "revert-field", field: "videoUrl" }), saving);
});
```

并把「page settings reuse the shared Media picker…」测试改为：`MediaPicker` → `MediaField`；`替换封面` → `封面图片`；删除 `kind="video"` 以外无需改；新增 `assert.match(source, /revert-field/); assert.match(source, /待保存/); assert.match(source, /默认封面/); assert.match(source, /PAGE MEDIA/); assert.doesNotMatch(source, /SourceDetails/);`；保留 `accept="video/mp4"`、`posterUrl`、`value: { ...heroState.draft, ...value }`、`/api/hero`、`blobUrl: heroState.draft.videoUrl`、`posterUrl: heroState.draft.posterUrl`、`/api/showreel`、导航守卫、`isSaveableSettingDirty(heroState) || isSaveableSettingDirty(showreelState)`、不直接引用 `@vercel/blob/client` 等断言。

- [ ] **Step 2: 运行确认失败** — `npx tsx --test tests/admin-settings.test.ts`。

- [ ] **Step 3: 实现** `lib/admin-settings.ts`

```ts
export type SaveableSettingEvent<T> =
  | { type: "change"; value: T }
  | { type: "revert-field"; field: keyof T }
  | { type: "save-start" }
  | { type: "save-success" }
  | { type: "save-error"; message: string };

function sameValue<T>(a: T, b: T) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// reducer 中：
case "change":
  if (state.status === "saving") return state;
  return { ...state, draft: event.value, status: sameValue(event.value, state.saved) ? "clean" : "dirty", error: null };
case "revert-field": {
  if (state.status === "saving") return state;
  const draft = { ...state.draft, [event.field]: state.saved[event.field] } as T;
  return { ...state, draft, status: sameValue(draft, state.saved) ? "clean" : "dirty", error: null };
}
```

  （`isSaveableSettingDirty` 改为调用 `sameValue`。）

  `page-settings.tsx`：保存函数、导航守卫、请求体保持。界面：
  - 外层 `mx-auto max-w-[60rem] space-y-5`；`AdminPageHeader title="PAGE MEDIA" subtitle="页面媒体" meta="首页和 Works 页使用的影片素材，保存后才会发布。"`（`meta` 在此用普通字体：传入 `<span className="font-sans">…</span>`）。
  - `MediaGroup({ title, hint, headerAction, children, footer })`：`section rounded-lg bg-admin-panel`，头部 `flex justify-between px-4 pt-3.5`，内容 `space-y-2 p-2`，底部保存条 `flex items-center justify-between gap-3 border-t border-admin-line px-4 py-3`。
  - Hero 组：两个 `MediaField size="large"`：
    - 背景视频：`id="hero-video" label="背景视频" kind="video" accept="video/mp4" value={draft.videoUrl} previewPoster={draft.posterUrl} onChange={(videoUrl) => onChange({ videoUrl })}`；
    - 封面图片：`id="hero-poster" label="封面图片" kind="image" value={draft.posterUrl} onChange={(posterUrl) => onChange({ posterUrl })}`，`badge={draft.posterUrl === DEFAULT_HERO_POSTER_URL ? <span className="text-xs text-admin-fg-3">默认封面</span> : null}`。
    - 每个槽当 `draft[field] !== saved[field]`：`badge` 追加 `<span className="rounded-[3px] bg-admin-accent px-1.5 text-xs font-medium text-admin-accent-fg">待保存</span>`；`description={<p className="truncate font-admin-mono text-xs text-admin-fg-3">当前 {describeMediaSource(saved).name} → 待保存 {describeMediaSource(draft).name}</p>}`；`actions={<Button size="sm" variant="ghost" onClick={() => dispatch({ type: "revert-field", field })}><Undo2/>撤销</Button>}`。
    - 封面默认值显示名：`saved/draft === DEFAULT_HERO_POSTER_URL` 时显示「默认封面」而不是 `hero-poster.webp`。
  - Showreel 组：头部右侧 `AdminFilterGroup label="Showreel 来源类型"`（嵌入链接 / 上传视频）；`url` 模式：`MediaField id="showreel-url" label="Showreel 影片" kind="video" allowEmbed size="large"` + `actions` 中「预览播放」按钮切换显示下方 `EmbedPreview`（iframe，`getEmbedUrl`）；`upload` 模式：`MediaField id="showreel-video" kind="video"`。待保存/撤销规则同 Hero（字段 `url`）。
  - 保存条：左侧 `AdminStatus`：`saving`→「保存中…」；`error`→「保存失败：{error}」（`role="alert"`）；`saved`→「设置已保存」（`role="status"`）；脏 →「{n} 项待保存」（n = 不同字段数，tone `dirty`）；否则 tone `ordinary`「已保存」。右侧按钮：脏时默认（橙）变体，否则 `variant="outline"`，文字「保存 Hero」/「保存 Showreel」，`disabled={saving}`。
  - 删除 `MediaAssetRow`、`MediaAssetPreview`、`SourceDetails`、`SettingStatus`、`SettingsSaveAction`。
  - `settings/loading.tsx`：两组 `article`（`rounded-lg bg-admin-panel`）共 3 个槽骨架，保留 `role="status"` 与至少 3 个 `<article>`。
- [ ] **Step 4: 运行** — `npx tsx --test tests/admin-settings.test.ts tests/admin-ui.test.ts && npx tsc --noEmit`。
- [ ] **Step 5: 提交** — `feat(admin): compact page media slots with per-slot revert`

---

### Task 10: 全量验证与浏览器检查

- [ ] **Step 1:** `npm test`（全部 PASS）、`npx tsc --noEmit`、`npx eslint .`（0 error；warning 不超过既有 5 条）、`git diff --check`。
- [ ] **Step 2:** `npx next build --webpack`；如预渲染 `/dashboard/settings` 因 `ECONNREFUSED` 失败，记录为「构建未完成（本地数据库不可用）」，不宣称通过。
- [ ] **Step 3:** `rg -n "white/10|neutral-[0-9]|rounded-full|AdminStatusBadge" components/admin app/\(admin\)` —— 除有意保留处（无）外清零。
- [ ] **Step 4:** 浏览器：`npm run dev`（经 `.claude/launch.json` 的 preview），请用户在浏览器面板登录；在 1440 / 768 / 375 宽度截图 `/login`、`/dashboard/works`、`/dashboard/works/order`、一个作品编辑页、`/dashboard/news`、一个文章编辑页、`/dashboard/settings`、`/dashboard/media`。只看不存。本地数据库不可用则记录，改为合并部署后线上只读检查。
- [ ] **Step 5:** 修复发现的问题（每个修复单独提交），更新 `HANDOFF.md`（未跟踪文件，只更新内容不提交）。
