# 相关作品推荐 + News 草稿状态 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** works 详情页底部加「相关作品」板块（同分类优先补位取 4）；Post 加 `published` 字段支持草稿，后台可存草稿/一键发布撤回，公开侧过滤草稿。

**Architecture:** 功能 1 纯页面层过滤缓存数据（零新查询）；功能 2 是 schema 迁移 + 数据层新增过滤函数 + API 可选字段 + 后台 UI 双态按钮。两功能相互独立。

**Tech Stack:** Next.js 16 (App Router/Turbopack)、Tailwind v4、Prisma + PostgreSQL、zod。验证：`npx tsc --noEmit` + `npx next build` + 手动核对（项目无测试框架）。

**设计文档:** `docs/superpowers/specs/2026-08-24-related-works-and-post-drafts-design.md`

---

### Task 1: 相关作品推荐

**Files:**
- Modify: `lib/utils.ts`
- Modify: `app/works/[id]/page.tsx`

- [ ] **Step 1: 在 `lib/utils.ts` 末尾添加 `pickRelatedVideos`**

在文件末尾（`getEmbedUrl` 之后）追加：

```ts
import type { VideoRow } from "@/lib/types";

export function pickRelatedVideos(
  videos: VideoRow[],
  current: { id: string; category: string },
  n = 4
): VideoRow[] {
  const others = videos.filter((v) => v.id !== current.id);
  const sameCategory = others.filter((v) => v.category === current.category);
  const picked: VideoRow[] = [];
  // 同分类优先（保持原排序），不足用其余最新补齐；引用去重
  for (const v of [...sameCategory, ...others]) {
    if (picked.length >= n) break;
    if (!picked.includes(v)) picked.push(v);
  }
  return picked;
}
```

注意：`import type` 放到文件顶部 import 区（`lib/utils.ts` 现有顶部是 clsx/tailwind-merge 导入），不要留在函数旁边。

- [ ] **Step 2: 详情页并行拉取全量视频并渲染相关板块**

修改 `app/works/[id]/page.tsx`：

a) 顶部导入改为：

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getVideo, getVideos } from "@/lib/data";
import { WorkPlayer } from "@/components/work-player";
import { MarkdownBody } from "@/components/markdown-body";
import { VideoCard } from "@/components/video-card";
import { pickRelatedVideos } from "@/lib/utils";
import type { VideoRow } from "@/lib/types";
```

b) 组件开头的数据获取改为：

```tsx
export default async function WorkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [video, allVideos] = await Promise.all([getVideo(id), getVideos()]);
  if (!video) notFound();

  const serializedAll: VideoRow[] = allVideos.map((v) => ({
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
  const related = pickRelatedVideos(serializedAll, video, 4);
```

c) 在组件 JSX 最外层 `<div className="max-w-5xl mx-auto">` 的结束标签之前（即现有按钮 `<div className="flex items-center gap-4 mt-10">...</div>` 之后）插入：

```tsx
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl md:text-3xl font-normal tracking-tight" style={{ fontFamily: "var(--font-bitcount)" }}>
              more.
            </h2>
            <p className="text-sm md:text-base text-neutral-400 font-light mt-1">相关作品</p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1">
              {related.map((v) => (
                <VideoCard key={v.id} video={v} />
              ))}
            </div>
          </div>
        )}
```

- [ ] **Step 3: 类型检查**

Run: `npx tsc --noEmit`
Expected: 无输出（0 error）

- [ ] **Step 4: 构建验证**

Run: `npx next build 2>&1 | Select-String "Compiled|Failed|error" | Select-Object -First 10`
Expected: 含 `Compiled successfully`，无 `error`

- [ ] **Step 5: 提交**

```bash
git add lib/utils.ts app/works/[id]/page.tsx
git commit -m "feat(works): related works section on detail page"
```

---

### Task 2: Post 增加 published 字段（schema + 迁移）

**Files:**
- Modify: `prisma/schema.prisma:41-49`
- Create: `prisma/migrations/<timestamp>_add_post_published/migration.sql`（由命令生成）

- [ ] **Step 1: 修改 `prisma/schema.prisma` 的 Post 模型**

将：

```prisma
model Post {
  id        String   @id @default(cuid())
  title     String?
  body      String
  tag       String?
  createdAt DateTime @default(now())

  @@index([createdAt])
}
```

改为：

```prisma
model Post {
  id        String   @id @default(cuid())
  title     String?
  body      String
  tag       String?
  published Boolean  @default(true)
  createdAt DateTime @default(now())

  @@index([createdAt])
}
```

- [ ] **Step 2: 生成迁移（同时重新生成 Prisma Client）**

Run: `npx prisma migrate dev --name add_post_published`
Expected: 输出含 `Your database is now in sync with your schema`，且生成 `prisma/migrations/*_add_post_published/migration.sql`

- [ ] **Step 3: 类型检查（确认新字段进入生成的类型）**

Run: `npx tsc --noEmit`
Expected: 无输出（0 error）

- [ ] **Step 4: 提交**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(posts): add published boolean field with migration"
```

---

### Task 3: 数据层与公开侧过滤

**Files:**
- Modify: `lib/types.ts:32-38`
- Modify: `lib/data.ts`
- Modify: `app/page.tsx`
- Modify: `app/news/[id]/page.tsx`

- [ ] **Step 1: `lib/types.ts` 的 PostItem 加 published**

将：

```ts
export interface PostItem {
  id: string;
  title: string | null;
  body: string;
  tag: string | null;
  createdAt: string; // ISO
}
```

改为：

```ts
export interface PostItem {
  id: string;
  title: string | null;
  body: string;
  tag: string | null;
  published: boolean;
  createdAt: string; // ISO
}
```

- [ ] **Step 2: `lib/data.ts` 新增 getPublishedPosts**

在 `getPosts` 之后追加：

```ts
export const getPublishedPosts = unstable_cache(
  async () =>
    db.post.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
    }),
  ["posts"],
  { tags: ["posts"] }
);
```

- [ ] **Step 3: 首页改用 getPublishedPosts 并序列化 published**

修改 `app/page.tsx`：导入行换成 `import { getHero, getVideos, getPublishedPosts } from "@/lib/data";`；数据获取行改为 `const [hero, videos, posts] = await Promise.all([getHero(), getVideos(), getPublishedPosts()]);`；`serializedPosts` 映射中增加一行 `published: p.published,`。

- [ ] **Step 4: news 详情页对草稿返回 404**

修改 `app/news/[id]/page.tsx`：

`generateMetadata` 中：

```tsx
  const post = await getPost(id);
  if (!post?.title || !post.published) return {};
```

页面主体中：

```tsx
  const post = await getPost(id);
  if (!post || !post.title || !post.published) notFound();
```

- [ ] **Step 5: 类型检查 + 构建验证**

Run: `npx tsc --noEmit`
Expected: 无输出

Run: `npx next build 2>&1 | Select-String "Compiled|Failed|error" | Select-Object -First 10`
Expected: 含 `Compiled successfully`

- [ ] **Step 6: 提交**

```bash
git add lib/types.ts lib/data.ts app/page.tsx "app/news/[id]/page.tsx"
git commit -m "feat(posts): filter drafts out of public pages"
```

---

### Task 4: API 支持 published 字段

**Files:**
- Modify: `lib/schemas.ts:27-31`
- Modify: `app/api/posts/route.ts:26`
- Modify: `app/api/posts/[id]/route.ts:19-27`

- [ ] **Step 1: `lib/schemas.ts` 的 postMutateSchema 加可选字段**

将：

```ts
export const postMutateSchema = z.object({
  title: z.string().max(200).nullish(),
  body: z.string().min(1).max(50000),
  tag: z.string().max(50).nullish(),
});
```

改为：

```ts
export const postMutateSchema = z.object({
  title: z.string().max(200).nullish(),
  body: z.string().min(1).max(50000),
  tag: z.string().max(50).nullish(),
  published: z.boolean().optional(),
});
```

- [ ] **Step 2: POST 默认 true**

修改 `app/api/posts/route.ts` 第 26 行：

```ts
  const post = await db.post.create({ data: { title, body, tag, published: b.published ?? true } });
```

- [ ] **Step 3: PUT 未传不覆盖**

修改 `app/api/posts/[id]/route.ts` 第 25 行为：

```ts
  const data: { title: string | null; body: string; tag: string | null; published?: boolean } = {
    title,
    body,
    tag,
  };
  if (typeof b.published === "boolean") data.published = b.published;

  const post = await db.post.update({ where: { id }, data });
```

- [ ] **Step 4: 类型检查 + 构建验证**

Run: `npx tsc --noEmit`
Expected: 无输出

Run: `npx next build 2>&1 | Select-String "Compiled|Failed|error" | Select-Object -First 10`
Expected: 含 `Compiled successfully`

- [ ] **Step 5: 提交**

```bash
git add lib/schemas.ts app/api/posts/route.ts "app/api/posts/[id]/route.ts"
git commit -m "feat(posts-api): accept optional published flag"
```

---

### Task 5: 后台 UI（存草稿/发布双态 + 列表徽章与切换）

**Files:**
- Modify: `components/admin/post-manager.tsx`

- [ ] **Step 1: 接口类型与导入调整**

`interface Post` 增加一行 `published: boolean;`。lucide 导入改为：

```tsx
import { Trash2, Pencil, Eye, EyeOff } from "lucide-react";
```

- [ ] **Step 2: handlePublish 参数化**

将现 `handlePublish` 重命名为带参版本（函数体仅 payload 与提示语变化）：

```tsx
  async function handleSave(published: boolean) {
    if (!body.trim() || saving) return;
    if (mode === "article" && !title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: mode === "article" ? title : null,
        body,
        tag: tag || null,
        published,
      };
      const res = editingId
        ? await fetch(`/api/posts/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (!res.ok) throw new Error();
      const post = await res.json();
      if (editingId) {
        setPosts((p) => p.map((x) => (x.id === editingId ? { ...post, createdAt: post.createdAt } : x)));
      } else {
        setPosts((p) => [{ ...post, createdAt: post.createdAt }, ...p]);
      }
      resetForm();
      router.refresh();
      toastSuccess(editingId ? "已更新" : published ? "已发布" : "已存草稿");
    } catch {
      toastError(editingId ? "更新失败" : "发布失败");
    } finally {
      setSaving(false);
    }
  }
```

- [ ] **Step 3: 新增列表行的一键切换**

在 `handleDelete` 之后添加：

```tsx
  async function handleTogglePublished(post: Post) {
    const target = !post.published;
    const prev = posts;
    setPosts((p) => p.map((x) => (x.id === post.id ? { ...x, published: target } : x)));
    const res = await fetch(`/api/posts/${post.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: post.title,
        body: post.body,
        tag: post.tag,
        published: target,
      }),
    });
    if (!res.ok) {
      setPosts(prev);
      toastError("操作失败");
      return;
    }
    router.refresh();
    toastSuccess(target ? "已发布" : "已转为草稿");
  }
```

- [ ] **Step 4: 动作区改为双按钮**

将现有单一 `<Button onClick={handlePublish} ...>` 替换为：

```tsx
          <Button onClick={() => handleSave(true)} disabled={saving}>
            {saving ? "保存中…" : "发布"}
          </Button>
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-4 py-1.5 text-sm border border-neutral-700 text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
          >
            存草稿
          </button>
```

- [ ] **Step 5: 列表行加草稿徽章与切换按钮**

在 tag 徽章之后、编辑按钮之前插入（徽章）；并在删除按钮之前插入切换按钮：

```tsx
              {!post.published && (
                <span className="text-xs border border-yellow-600/60 text-yellow-500 px-2 py-0.5 flex-shrink-0">
                  草稿
                </span>
              )}
```

```tsx
              <button
                onClick={() => handleTogglePublished(post)}
                aria-label={post.published ? "撤回为草稿" : "发布"}
                className="text-neutral-500 hover:text-white transition-colors flex-shrink-0"
              >
                {post.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
```

注意：dashboard 页面传给 PostManager 的 initialPosts 来自直接查库（含 published），无需改 dashboard；但 PostManager 的 `interface Post` 与传入数据结构需一致——若 dashboard 有独立的序列化步骤则同步补 `published` 字段。

- [ ] **Step 6: 类型检查 + 构建验证**

Run: `npx tsc --noEmit`
Expected: 无输出

Run: `npx next build 2>&1 | Select-String "Compiled|Failed|error" | Select-Object -First 10`
Expected: 含 `Compiled successfully`

- [ ] **Step 7: 提交**

```bash
git add components/admin/post-manager.tsx
git commit -m "feat(admin): draft/publish toggle for news posts"
```

---

### Task 6: 端到端人工验收 + 推送

**Files:**
- 无（只读验证 + git push）

- [ ] **Step 1: 启动 dev 并逐项核对**

Run: `npm run dev` 后浏览器打开 `http://localhost:3000`：
1. 任一 works 详情页底部出现「more. / 相关作品」最多 4 张卡片，同分类优先；单作品时该板块隐藏
2. 后台发一条短动态点「存草稿」→ 首页 news 不出现、后台列表有黄色「草稿」徽章
3. 列表对该条点 Eye 图标发布 → 前台可见；再点 EyeOff 撤回 → 前台消失、详情 URL 直接 404
4. 编辑一篇已发布文章仅改文字点「存草稿」→ 变为草稿（验证 PUT 显式覆盖）
5. 存量旧文章在前台仍正常显示（默认 published=true）
6. Hero 视差、卡片 hover、页面过渡等既有动画不受影响

- [ ] **Step 2: 确认工作树干净**

Run: `git status`
Expected: 无未暂存改动

- [ ] **Step 3: 推送**

```bash
git push
```

Expected: `master -> master` 成功。部署时 Vercel build 自动执行 `prisma migrate deploy` 应用迁移。
