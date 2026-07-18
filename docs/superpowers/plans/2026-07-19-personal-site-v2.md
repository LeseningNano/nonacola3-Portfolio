# 个人网站化重构 v2 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将视频作品集扩展为单页个人网站：News 动态系统、works 循环滚动行、about 并入主页、视频/文章独立详情页、页面过渡与微动效。

**Architecture:** Next.js 16 App Router 服务端组件 + `unstable_cache` 数据层（`lib/data.ts`）；主页单页四板块（Hero/works/news/about）；详情页 `/works/[id]`、`/news/[id]` 独立路由；View Transitions 共享元素过渡（回退黑场）。

**Tech Stack:** Next.js 16, React 19, Tailwind 4, Prisma 7 (PostgreSQL/Neon), NextAuth v5, react-markdown, remark-gfm, lucide-react

**Spec:** `docs/superpowers/specs/2026-07-19-personal-site-redesign-design.md`

**全局约定：**
- 配色：`#0a0a0a` 底 + `neutral-*` 灰阶 + 白，无彩色点缀
- 字体变量：`var(--font-bitcount)`（板块标题）、`var(--font-montserrat)`
- 每个 Task 完成后提交一次 commit
- Next 16 中动态路由 `params` 是 Promise，必须 `await params`
- `revalidateTag` 需两参数：`revalidateTag("posts", "max")`

---

### Task 1: Post 模型 + Prisma migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: 在 schema.prisma 末尾追加 Post 模型**

```prisma
model Post {
  id        String   @id @default(cuid())
  title     String?              // 空 = 短动态；非空 = 文章（有详情页）
  body      String               // 短动态的一句话 或 文章的 Markdown 全文
  tag       String?              // 可选分类标签（作品/日常/活动…）
  createdAt DateTime @default(now())
}
```

- [ ] **Step 2: 运行 migration**

Run: `npx prisma migrate dev --name add_posts`
Expected: migration 创建成功，客户端重新生成，无报错

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add Post model for news feed"
```

---

### Task 2: Posts API 路由

**Files:**
- Create: `app/api/posts/route.ts`
- Create: `app/api/posts/[id]/route.ts`

参照现有 `app/api/videos/route.ts` 的 auth 模式（`import { auth } from "@/lib/auth"`）。

- [ ] **Step 1: 创建 `app/api/posts/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const posts = await db.post.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, body, tag } = await req.json();
  if (!body || typeof body !== "string" || !body.trim()) {
    return NextResponse.json({ error: "内容不能为空" }, { status: 400 });
  }

  const post = await db.post.create({
    data: {
      title: title?.trim() || null,
      body: body.trim(),
      tag: tag?.trim() || null,
    },
  });
  revalidateTag("posts", "max");
  return NextResponse.json(post, { status: 201 });
}
```

- [ ] **Step 2: 创建 `app/api/posts/[id]/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.post.delete({ where: { id } });
  revalidateTag("posts", "max");
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: 类型检查**

Run: `npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 4: Commit**

```bash
git add app/api/posts
git commit -m "feat: add posts API (GET public, POST/DELETE auth)"
```

---

### Task 3: lib/data.ts 数据层扩展

**Files:**
- Modify: `lib/data.ts`

- [ ] **Step 1: 在 `lib/data.ts` 末尾追加**

```ts
export const getPosts = unstable_cache(
  async () => db.post.findMany({ orderBy: { createdAt: "desc" } }),
  ["posts"],
  { tags: ["posts"] }
);

export const getPost = unstable_cache(
  async (id: string) => db.post.findUnique({ where: { id } }),
  ["post"],
  { tags: ["posts"] }
);

export const getVideo = unstable_cache(
  async (id: string) => db.video.findUnique({ where: { id } }),
  ["video"],
  { tags: ["videos"] }
);
```

- [ ] **Step 2: 类型检查**

Run: `npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: Commit**

```bash
git add lib/data.ts
git commit -m "feat: add getPosts/getPost/getVideo to data layer"
```

---

### Task 4: 真实社交链接

**Files:**
- Modify: `lib/config.ts`

- [ ] **Step 1: 替换 `socialLinks` 数组为**

```ts
export const socialLinks = [
  { name: "Bilibili", url: "https://space.bilibili.com/13361398", icon: "bilibili" },
  { name: "YouTube", url: "https://www.youtube.com/@nonacola3", icon: "youtube" },
  { name: "X", url: "https://x.com/nonacola3", icon: "twitter" },
  { name: "小红书", url: "https://xhslink.com/m/4oYQKJkJs3z", icon: "xiaohongshu" },
] as const;
```

- [ ] **Step 2: Commit**

```bash
git add lib/config.ts
git commit -m "feat: real social links"
```

---

### Task 5: Dashboard News 管理（PostManager）

**Files:**
- Create: `components/admin/post-manager.tsx`
- Modify: `app/(admin)/dashboard/page.tsx`

- [ ] **Step 1: 创建 `components/admin/post-manager.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";

interface Post {
  id: string;
  title: string | null;
  body: string;
  tag: string | null;
  createdAt: string;
}

export function PostManager({ initialPosts }: { initialPosts: Post[] }) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [mode, setMode] = useState<"short" | "article">("short");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tag, setTag] = useState("");
  const [saving, setSaving] = useState(false);

  async function handlePublish() {
    if (!body.trim() || saving) return;
    if (mode === "article" && !title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: mode === "article" ? title : null,
          body,
          tag: tag || null,
        }),
      });
      if (!res.ok) throw new Error();
      const post = await res.json();
      setPosts((p) => [{ ...post, createdAt: post.createdAt }, ...p]);
      setTitle("");
      setBody("");
      setTag("");
      router.refresh();
    } catch {
      alert("发布失败");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除这条动态？")) return;
    const prev = posts;
    setPosts((p) => p.filter((x) => x.id !== id));
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setPosts(prev);
      alert("删除失败");
    } else {
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      {/* 发布框 */}
      <div className="border border-neutral-800 p-4 space-y-3">
        <div className="flex gap-2">
          <button
            onClick={() => setMode("short")}
            className={`px-4 py-1.5 text-sm border transition-colors ${mode === "short" ? "border-white text-white" : "border-neutral-700 text-neutral-400 hover:text-white"}`}
          >
            短动态
          </button>
          <button
            onClick={() => setMode("article")}
            className={`px-4 py-1.5 text-sm border transition-colors ${mode === "article" ? "border-white text-white" : "border-neutral-700 text-neutral-400 hover:text-white"}`}
          >
            文章（Markdown）
          </button>
        </div>
        {mode === "article" && (
          <Input
            placeholder="文章标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-neutral-900 border-neutral-700"
          />
        )}
        <textarea
          placeholder={mode === "article" ? "正文（支持 Markdown）" : "一句话动态…"}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={mode === "article" ? 8 : 2}
          className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500"
        />
        <div className="flex gap-3 items-center">
          <Input
            placeholder="标签（可选，如：作品/日常/活动）"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="bg-neutral-900 border-neutral-700 max-w-xs"
          />
          <Button onClick={handlePublish} disabled={saving}>
            {saving ? "发布中…" : "发布"}
          </Button>
        </div>
      </div>

      {/* 列表 */}
      {posts.length === 0 ? (
        <p className="text-neutral-500 text-sm">暂无动态。</p>
      ) : (
        <div className="divide-y divide-neutral-800 border border-neutral-800">
          {posts.map((post) => (
            <div key={post.id} className="flex items-center gap-4 px-4 py-3">
              <span className="text-xs text-neutral-500 font-mono flex-shrink-0">
                {new Date(post.createdAt).toLocaleDateString("zh-CN")}
              </span>
              <span className="text-sm text-neutral-300 truncate flex-1">
                {post.title ? `【文章】${post.title}` : post.body}
              </span>
              {post.tag && (
                <span className="text-xs text-neutral-500 border border-neutral-700 px-2 py-0.5 flex-shrink-0">
                  {post.tag}
                </span>
              )}
              <button
                onClick={() => handleDelete(post.id)}
                className="text-neutral-500 hover:text-red-400 transition-colors flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 修改 `app/(admin)/dashboard/page.tsx`**

在文件顶部 import 区追加：

```ts
import { PostManager } from "@/components/admin/post-manager";
```

在 `const videos = await ...` 之后追加：

```ts
const posts = await db.post.findMany({ orderBy: { createdAt: "desc" } });
const serializedPosts = posts.map((p) => ({
  id: p.id,
  title: p.title,
  body: p.body,
  tag: p.tag,
  createdAt: p.createdAt.toISOString(),
}));
```

在 `</section>`（作品管理）之后、最外层 `</div>` 之前追加：

```tsx
      {/* News 管理 */}
      <section>
        <h2 className="text-lg font-semibold text-neutral-300 mb-4">News 管理</h2>
        <PostManager initialPosts={serializedPosts} />
      </section>
```

- [ ] **Step 3: 类型检查**

Run: `npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 4: Commit**

```bash
git add components/admin/post-manager.tsx "app/(admin)/dashboard/page.tsx"
git commit -m "feat: dashboard news manager"
```

---

### Task 6: 视频详情页 `/works/[id]`

**Files:**
- Create: `components/vt-target.tsx`
- Create: `components/work-player.tsx`
- Create: `app/works/[id]/page.tsx`

- [ ] **Step 1: 创建 `components/vt-target.tsx`（View Transition 命名容器）**

```tsx
"use client";

export function VtTarget({
  name,
  className,
  children,
}: {
  name: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      ref={(el) => {
        if (el) el.style.viewTransitionName = name;
      }}
      className={className}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: 创建 `components/work-player.tsx`**

```tsx
"use client";

import { getEmbedUrl } from "@/lib/utils";
import { VtTarget } from "./vt-target";

export function WorkPlayer({
  videoId,
  embedUrl,
  title,
}: {
  videoId: string;
  embedUrl: string;
  title: string;
}) {
  const src = getEmbedUrl(embedUrl);
  const sep = src.includes("?") ? "&" : "?";
  return (
    <VtTarget name={`video-${videoId}`} className="aspect-video w-full overflow-hidden bg-black">
      <iframe
        src={`${src}${sep}mute=1&muted=1`}
        title={title}
        className="w-full h-full"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
    </VtTarget>
  );
}
```

- [ ] **Step 3: 创建 `app/works/[id]/page.tsx`**

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getVideo } from "@/lib/data";
import { WorkPlayer } from "@/components/work-player";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const video = await getVideo(id);
  if (!video) return {};
  return {
    title: video.title,
    description: video.summary ?? video.description ?? undefined,
  };
}

export default async function WorkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const video = await getVideo(id);
  if (!video) notFound();

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-16 px-6 md:px-12">
      <div className="max-w-5xl mx-auto">
        <WorkPlayer videoId={video.id} embedUrl={video.embedUrl} title={video.title} />

        <h1 className="text-2xl md:text-4xl font-bold text-white mt-8 break-words">{video.title}</h1>
        <div className="flex items-center gap-3 mt-3">
          <span className="text-xs font-medium text-neutral-400 border border-neutral-700 px-2 py-0.5">
            {video.category}
          </span>
          {video.date && (
            <span className="text-xs text-neutral-500">
              {new Date(video.date).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
            </span>
          )}
        </div>

        {video.summary && (
          <p className="text-neutral-300 mt-6 text-base md:text-lg leading-relaxed break-words">{video.summary}</p>
        )}
        {video.description && (
          <div className="mt-8 border-t border-neutral-800 pt-6">
            <h2 className="text-sm font-medium text-neutral-400 mb-3">关于</h2>
            <p className="text-neutral-300 leading-relaxed whitespace-pre-line break-words">{video.description}</p>
          </div>
        )}

        <div className="flex items-center gap-4 mt-10">
          <a
            href={video.embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-neutral-300 hover:text-white border border-neutral-400 hover:border-white px-4 py-2 transition-all duration-300"
          >
            跳转至视频
            <ExternalLink className="w-4 h-4" />
          </a>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-neutral-300 hover:text-white border border-neutral-400 hover:border-white px-4 py-2 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            返回主页
          </Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 类型检查 + 手动验证**

Run: `npx tsc --noEmit`（无错误）；dev server 访问 `/works/<某个视频id>` 确认页面渲染

- [ ] **Step 5: Commit**

```bash
git add components/vt-target.tsx components/work-player.tsx app/works
git commit -m "feat: standalone video detail page /works/[id]"
```

---

### Task 7: VideoCard 改为链接导航，删除 VideoModal

**Files:**
- Modify: `components/video-card.tsx`（整体重写）
- Modify: `components/video-grid.tsx`
- Delete: `components/video-modal.tsx`

- [ ] **Step 1: 重写 `components/video-card.tsx`**

```tsx
import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";

interface Video {
  id: string;
  title: string;
  description: string | null;
  summary: string | null;
  category: string;
  embedUrl: string;
  thumbnail: string | null;
  date: string | null;
}

export function VideoCard({ video }: { video: Video }) {
  return (
    <Link href={`/works/${video.id}`} aria-label={video.title} className="block">
      <div
        data-vt-id={video.id}
        className="group relative aspect-video bg-neutral-900 overflow-hidden cursor-pointer"
      >
        {video.thumbnail ? (
          <Image
            src={video.thumbnail}
            alt={video.title}
            fill
            sizes="(max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-all duration-300 group-hover:scale-105 group-hover:brightness-110"
          />
        ) : (
          <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
            <Play className="w-12 h-12 text-neutral-600" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent transition-all duration-300" />
        {/* Always visible: category + title at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 z-10">
          <span className="text-[10px] md:text-xs lg:text-sm text-neutral-400 mb-1 block">{video.category}</span>
          <h3 className="font-semibold text-xs sm:text-sm md:text-base lg:text-lg leading-tight">{video.title}</h3>
          {video.summary && (
            <div className="grid transition-[grid-template-rows] duration-300 ease-in-out grid-rows-[0fr] group-hover:grid-rows-[1fr]">
              <p className="text-neutral-300 text-[10px] sm:text-xs md:text-sm lg:text-base line-clamp-2 overflow-hidden">
                <span className="block mt-1">{video.summary}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
```

注意：组件不再是 client component（无 "use client"，无 onClick/state）。

- [ ] **Step 2: 修改 `components/video-grid.tsx`**

删除 `import { VideoModal } from "./video-modal";`、`const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);`、`{selectedVideo && (<VideoModal ... />)}` 整段。
`<VideoCard key={video.id} video={video} onClick={...} />` 改为 `<VideoCard key={video.id} video={video} />`。

- [ ] **Step 3: 删除 `components/video-modal.tsx`**

Run: `Remove-Item components/video-modal.tsx`

- [ ] **Step 4: 类型检查 + lint**

Run: `npx tsc --noEmit; npm run lint`
Expected: 无错误（确认无残留 VideoModal 引用）

- [ ] **Step 5: Commit**

```bash
git add components/video-card.tsx components/video-grid.tsx components/video-modal.tsx
git commit -m "feat: video card navigates to detail page, remove VideoModal"
```

---

### Task 8: works 循环滚动行 + 显示全部开关

**Files:**
- Modify: `app/globals.css`
- Create: `components/works-marquee.tsx`
- Modify: `components/video-grid.tsx`

- [ ] **Step 1: `app/globals.css` 末尾追加 marquee 样式**

```css
@keyframes marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
.animate-marquee {
  animation: marquee 45s linear infinite;
}
.marquee-container:hover .animate-marquee {
  animation-play-state: paused;
}
```

- [ ] **Step 2: 创建 `components/works-marquee.tsx`**

```tsx
import { VideoCard } from "./video-card";

interface Video {
  id: string;
  title: string;
  description: string | null;
  summary: string | null;
  category: string;
  embedUrl: string;
  thumbnail: string | null;
  featured: boolean;
  order: number;
  date: string | null;
}

export function WorksMarquee({ videos }: { videos: Video[] }) {
  // 复制一份实现无缝循环；translateX(-50%) 时第二份恰好接上
  const doubled = [...videos, ...videos];
  return (
    <div className="marquee-container overflow-hidden w-full">
      <div className="animate-marquee flex gap-1 w-max">
        {doubled.map((video, i) => (
          <div key={`${video.id}-${i}`} className="w-64 md:w-80 flex-shrink-0" aria-hidden={i >= videos.length}>
            <VideoCard video={video} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 修改 `components/video-grid.tsx` 渲染逻辑**

在 import 区追加 `import { WorksMarquee } from "./works-marquee";`，state 区追加 `const [showAll, setShowAll] = useState(false);`。

将现有的年份筛选 `div`（`px-6 ... mb-8` 包裹 CategoryFilter）和作品网格 `div.grid` 整体替换为：

```tsx
        {showAll ? (
          <>
            <div className="px-6 md:px-12 lg:px-16 mb-8">
              <CategoryFilter
                categories={years}
                selected={selectedYear}
                onSelect={setSelectedYear}
              />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-1">
              {filteredVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </>
        ) : (
          <WorksMarquee videos={videos} />
        )}

        {/* 展开/收起开关 */}
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setShowAll((v) => !v)}
            className="text-xs md:text-sm tracking-widest text-neutral-300 hover:text-white border border-neutral-400 hover:border-white px-5 py-2.5 transition-all duration-300"
          >
            {showAll ? "收起 ⌃" : `显示全部作品 ⌄ ${videos.length}`}
          </button>
        </div>
```

同时删除原来独立的 CategoryFilter 渲染块（避免重复）。

- [ ] **Step 4: 类型检查 + 手动验证**

Run: `npx tsc --noEmit`；dev server 确认：循环行自动滚动、悬停暂停、点击卡片进详情页、开关展开/收起正常

- [ ] **Step 5: Commit**

```bash
git add app/globals.css components/works-marquee.tsx components/video-grid.tsx
git commit -m "feat: works marquee row with show-all toggle"
```

---

### Task 9: News 板块上主页

**Files:**
- Create: `components/news-section.tsx`
- Modify: `components/home-client.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: 创建 `components/news-section.tsx`**

```tsx
import Link from "next/link";

export interface PostItem {
  id: string;
  title: string | null;
  body: string;
  tag: string | null;
  createdAt: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export function NewsSection({ posts }: { posts: PostItem[] }) {
  const recent = posts.slice(0, 5);
  return (
    <section id="news" className="w-full bg-[#0a0a0a] px-6 md:px-12 lg:px-16 pt-16">
      <h2 className="text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight" style={{ fontFamily: "var(--font-bitcount)" }}>
        news.
      </h2>
      <p className="text-base md:text-lg text-neutral-400 font-light mt-1">最新动态</p>

      {recent.length === 0 ? (
        <p className="text-neutral-600 text-sm mt-8">暂无动态。</p>
      ) : (
        <div className="mt-8 border-t border-neutral-800">
          {recent.map((post) => {
            const inner = (
              <>
                <span className="text-xs text-neutral-500 font-mono flex-shrink-0 w-12">
                  {formatDate(post.createdAt)}
                </span>
                <span className="text-sm md:text-base text-neutral-300 group-hover:text-white transition-colors truncate">
                  {post.title ?? post.body}
                </span>
                {post.tag && (
                  <span className="text-[10px] text-neutral-500 border border-neutral-800 px-2 py-0.5 flex-shrink-0">
                    {post.tag}
                  </span>
                )}
                {post.title && (
                  <span className="text-xs text-neutral-500 group-hover:text-white transition-colors flex-shrink-0 ml-auto">
                    阅读全文 →
                  </span>
                )}
              </>
            );
            const rowClass =
              "group relative flex items-center gap-4 py-3.5 border-b border-neutral-900 hover:bg-white/5 transition-colors duration-200 before:absolute before:left-0 before:top-0 before:h-full before:w-0.5 before:bg-white before:scale-y-0 hover:before:scale-y-100 before:transition-transform before:duration-200 before:origin-center";
            return post.title ? (
              <Link key={post.id} href={`/news/${post.id}`} className={rowClass}>
                {inner}
              </Link>
            ) : (
              <div key={post.id} className={rowClass}>
                {inner}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: 修改 `app/page.tsx`**

import 区改为 `import { getHero, getVideos, getPosts } from "@/lib/data";`。
`Promise.all` 改为 `const [hero, videos, posts] = await Promise.all([getHero(), getVideos(), getPosts()]);`。
`serializedVideos` 之后追加：

```ts
  const serializedPosts = posts.map((p) => ({
    id: p.id,
    title: p.title,
    body: p.body,
    tag: p.tag,
    createdAt: new Date(p.createdAt).toISOString(),
  }));
```

JSX 改为：

```tsx
    <HomeClient
      heroVideoUrl={hero?.blobUrl ?? null}
      videos={serializedVideos}
      posts={serializedPosts}
    />
```

- [ ] **Step 3: 修改 `components/home-client.tsx`**

import 区追加：

```tsx
import { NewsSection } from "@/components/news-section";
import type { PostItem } from "@/components/news-section";
```

组件签名改为：

```tsx
export function HomeClient({
  heroVideoUrl,
  videos,
  posts,
}: {
  heroVideoUrl: string | null;
  videos: Video[];
  posts: PostItem[];
}) {
```

渲染区 `<VideoGrid videos={videos} />` 之后追加 `<NewsSection posts={posts} />`。

- [ ] **Step 4: 类型检查 + 手动验证**

Run: `npx tsc --noEmit`；dev server 确认 news 板块显示（先在 dashboard 发一两条动态）

- [ ] **Step 5: Commit**

```bash
git add components/news-section.tsx components/home-client.tsx app/page.tsx
git commit -m "feat: news section on homepage"
```

---

### Task 10: About 板块并入主页，删除 /about 页面

**Files:**
- Create: `components/about-section.tsx`
- Modify: `components/home-client.tsx`
- Delete: `app/about/page.tsx`（整个 `app/about/` 目录）

- [ ] **Step 1: 创建 `components/about-section.tsx`**（沿用现 about 页文案与样式，去掉返回按钮，标题改 `about.`）

```tsx
import { siteConfig, socialLinks } from "@/lib/config";

export function AboutSection() {
  return (
    <section id="about" className="w-full bg-[#0a0a0a] px-6 md:px-12 lg:px-16 pt-16 pb-8">
      <h2 className="text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight" style={{ fontFamily: "var(--font-bitcount)" }}>
        about.
      </h2>
      <p className="text-base md:text-lg text-neutral-400 font-light mt-1">了解更多 & 合作洽谈</p>

      <div className="mt-10 flex flex-col md:flex-row gap-12 md:gap-16">
        <p className="text-base md:text-lg text-neutral-300 leading-relaxed max-w-2xl flex-1">
          我是nonacola3，是一名业余PV师，正在努力进步中。热爱影像创作（也爱打游戏），喜欢用视觉语言讲述故事。期待通过每一个作品不断打磨技术，也希望能与更多志同道合的朋友交流合作。
        </p>
        <div className="md:border-l md:border-neutral-800 md:pl-12 flex-shrink-0">
          <p className="text-xs text-neutral-500 uppercase tracking-widest mb-3">Contact</p>
          <a
            href={`mailto:${siteConfig.email}`}
            className="text-lg md:text-xl hover:text-neutral-300 transition-colors block mb-6"
          >
            {siteConfig.email}
          </a>
          <div className="flex flex-wrap gap-2">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 border border-neutral-400 hover:border-white text-neutral-300 hover:text-white transition-all duration-300 text-sm"
              >
                {link.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: 修改 `components/home-client.tsx`**

import 区追加 `import { AboutSection } from "@/components/about-section";`。
`<NewsSection posts={posts} />` 之后追加 `<AboutSection />`。

注意：Footer 目前在 `components/video-grid.tsx` 内部渲染——它位于 works 板块内，现在在 about 之前。将 Footer 从 video-grid 中移除（删除 video-grid.tsx 中的 `import { Footer } ...` 和 `<Footer />`），改在 home-client 中 `<AboutSection />` 之后渲染 `<Footer />`（home-client 中 import）。

- [ ] **Step 3: 删除 about 页面**

Run: `Remove-Item -Recurse app/about`

- [ ] **Step 4: 类型检查 + lint + 手动验证**

Run: `npx tsc --noEmit; npm run lint`
Expected: 无错误；页面底部顺序 works → news → about → footer

- [ ] **Step 5: Commit**

```bash
git add components/about-section.tsx components/home-client.tsx components/video-grid.tsx app/about
git commit -m "feat: about section merged into homepage, remove /about page"
```

---

### Task 11: 导航栏页内锚点

**Files:**
- Modify: `components/navbar.tsx`（整体重写）
- Modify: `components/home-client.tsx`

- [ ] **Step 1: 重写 `components/navbar.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { siteConfig } from "@/lib/config";

const SECTIONS = [
  { id: "works", label: "WORKS" },
  { id: "news", label: "NEWS" },
  { id: "about", label: "ABOUT" },
];

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

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
      <div className="px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-normal text-lg" style={{ fontFamily: "var(--font-bitcount)" }}>
          {siteConfig.name}
        </Link>
        <div className="flex items-center gap-6">
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
      </div>
    </nav>
  );
}
```

注意：`pathname` 变量如未使用则删除该声明（避免 lint 警告）。

- [ ] **Step 2: `components/home-client.tsx` 追加 pending-scroll 处理**

在主 `useEffect` 之后追加一个新的 useEffect：

```tsx
  // 从其他页面带锚点跳回主页时，滚动到目标板块
  useEffect(() => {
    const id = sessionStorage.getItem("pending-scroll");
    if (!id) return;
    sessionStorage.removeItem("pending-scroll");
    // 等渲染完成后计算位置
    setTimeout(() => {
      const container = document.getElementById("main-scroll");
      const el = document.getElementById(id);
      if (container && el) {
        container.dispatchEvent(
          new CustomEvent("smooth-scroll-to", { detail: { target: el.offsetTop } })
        );
      } else if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }, 300);
  }, []);
```

- [ ] **Step 3: `app/globals.css` 末尾追加 link-sweep 样式**

```css
.link-sweep {
  position: relative;
}
.link-sweep::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -2px;
  height: 1px;
  width: 100%;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 250ms ease-out;
}
.link-sweep:hover::after {
  transform: scaleX(1);
}
```

- [ ] **Step 4: 类型检查 + 手动验证**

Run: `npx tsc --noEmit`；验证：主页点 WORKS/NEWS/ABOUT 惯性滚动到位；从详情页点锚点能回主页并滚动到位

- [ ] **Step 5: Commit**

```bash
git add components/navbar.tsx components/home-client.tsx app/globals.css
git commit -m "feat: navbar in-page anchors with inertia scroll"
```

---

### Task 12: News 详情页 `/news/[id]`（Markdown）

**Files:**
- Create: `app/news/[id]/page.tsx`
- Create: `components/markdown-body.tsx`

- [ ] **Step 1: 安装依赖**

Run: `npm install react-markdown remark-gfm`

- [ ] **Step 2: 创建 `components/markdown-body.tsx`**

```tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownBody({ content }: { content: string }) {
  return (
    <div className="text-neutral-300 leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (p) => <h1 className="text-2xl font-bold text-white mt-8 mb-4" {...p} />,
          h2: (p) => <h2 className="text-xl font-bold text-white mt-8 mb-3" {...p} />,
          h3: (p) => <h3 className="text-lg font-semibold text-white mt-6 mb-2" {...p} />,
          p: (p) => <p className="mb-4" {...p} />,
          a: (p) => <a className="text-white underline underline-offset-4 hover:text-neutral-300" target="_blank" rel="noopener noreferrer" {...p} />,
          ul: (p) => <ul className="list-disc list-inside mb-4 space-y-1" {...p} />,
          ol: (p) => <ol className="list-decimal list-inside mb-4 space-y-1" {...p} />,
          blockquote: (p) => <blockquote className="border-l-2 border-neutral-600 pl-4 my-4 text-neutral-400" {...p} />,
          code: ({ className, children, ...p }) => (
            <code className={`bg-neutral-800 px-1.5 py-0.5 text-sm ${className ?? ""}`} {...p}>
              {children}
            </code>
          ),
          pre: (p) => <pre className="bg-neutral-900 border border-neutral-800 p-4 overflow-x-auto my-4 text-sm" {...p} />,
          hr: () => <hr className="border-neutral-800 my-8" />,
          img: (p) => <img className="max-w-full my-4" {...p} alt={p.alt ?? ""} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
```

- [ ] **Step 3: 创建 `app/news/[id]/page.tsx`**

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPost } from "@/lib/data";
import { MarkdownBody } from "@/components/markdown-body";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post?.title) return {};
  return { title: post.title };
}

export default async function NewsPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post || !post.title) notFound();

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-16 px-6 md:px-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 text-xs text-neutral-500">
          <span className="font-mono">
            {new Date(post.createdAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
          </span>
          {post.tag && (
            <span className="border border-neutral-700 px-2 py-0.5">{post.tag}</span>
          )}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mt-4 mb-10 break-words">{post.title}</h1>
        <MarkdownBody content={post.body} />
        <div className="mt-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-neutral-300 hover:text-white border border-neutral-400 hover:border-white px-4 py-2 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            返回主页
          </Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 类型检查 + 手动验证**

Run: `npx tsc --noEmit`；dashboard 发一篇文章，主页点「阅读全文 →」确认 Markdown 渲染

- [ ] **Step 5: Commit**

```bash
git add app/news components/markdown-body.tsx package.json package-lock.json
git commit -m "feat: news article detail page with markdown rendering"
```

---

### Task 13: View Transitions 共享元素过渡

**Files:**
- Modify: `components/progress-bar.tsx`

- [ ] **Step 1: 修改 `handleClick` 中内部链接分支**

在 `components/progress-bar.tsx` 的 `handleClick` 内，`if (href.startsWith("/") && !href.startsWith("//"))` 分支里、`e.preventDefault(); startTransition(href);` 之前插入：

```ts
        // 作品卡片 → 详情页：优先 View Transitions 共享元素过渡
        if (href.startsWith("/works/") && "startViewTransition" in document) {
          e.preventDefault();
          e.stopPropagation();
          const vtEl = anchor.querySelector("[data-vt-id]") as HTMLElement | null;
          if (vtEl) vtEl.style.viewTransitionName = `video-${vtEl.dataset.vtId}`;
          const vt = (document as Document & {
            startViewTransition: (cb: () => Promise<void>) => { finished: Promise<void> };
          }).startViewTransition(() => {
            router.push(href);
            return new Promise<void>((resolve) => {
              const check = () => {
                if (window.location.pathname === href) resolve();
                else requestAnimationFrame(check);
              };
              check();
            });
          });
          vt.finished.finally(() => {
            if (vtEl) vtEl.style.viewTransitionName = "";
          });
          return;
        }
```

注意：原分支内已有 `e.preventDefault(); e.stopPropagation(); startTransition(href);`，新代码插入在它之前并 return。

- [ ] **Step 2: 手动验证**

dev server：主页点击作品卡片 → 缩略图平滑变形飞入详情页播放器；返回正常。强制禁用 VT（可用 Safari 或注释判断）则回退黑场。

- [ ] **Step 3: Commit**

```bash
git add components/progress-bar.tsx
git commit -m "feat: view transitions shared-element for work detail navigation"
```

---

### Task 14: 最终验证 + 推送

- [ ] **Step 1: 全套检查**

Run: `npx tsc --noEmit; npm run lint; npm run build`
Expected: 全部通过

- [ ] **Step 2: 手动冒烟清单**

- 主页四板块顺序：Hero → works（循环行）→ news → about → footer
- 循环行自动滚动 / 悬停暂停 / 显示全部展开收起（年份筛选在展开态可用）
- 作品卡片 → 详情页 VT 过渡；详情页播放器/信息/外链/返回
- news 短动态直接显示；文章「阅读全文 →」→ Markdown 详情页
- dashboard 发布/删除动态后主页即时更新
- 导航锚点惯性滚动；详情页点锚点回主页定位
- 移动端（宽度 <768px）：自然滚动、网格 2 列、循环行正常

- [ ] **Step 3: Commit + push**

```bash
git add -A
git commit -m "chore: final verification for personal site v2" --allow-empty
git push
```

---

## Self-Review 记录

- Spec 覆盖：News 系统（T1/2/3/5/9/12）✓、循环行+开关（T8）✓、about 并入（T10）✓、视频详情页（T6/7）✓、文章详情（T12）✓、VT 过渡（T13）✓、微动效（T8 卡片提亮/T9 news 行 hover/T11 link-sweep/按钮语言沿用）✓、社交链接（T4）✓、导航锚点（T11）✓
- 类型一致性：`PostItem` 接口在 news-section 定义并导出，home-client 复用 ✓；`getPost/getVideo/getPosts` 命名一致 ✓
- 已知取舍：短动态无详情页（`/news/[id]` 对无 title 的 post 直接 404）✓ 与 spec 一致
