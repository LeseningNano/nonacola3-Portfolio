# 相关作品推荐 + News 草稿状态 设计

- 日期：2026-08-24
- 范围：两个独立小功能——works 详情页底部相关作品推荐；news 草稿/发布状态
- 状态：设计已与用户确认（选取逻辑：同分类优先+补位；草稿默认行为：发布直上线+存草稿按钮）
- 明确不做：RSS feed（用户否决）

## 功能 1：相关作品推荐

### 位置与结构

`app/works/[id]/page.tsx` 底部（现有按钮区之后）新增板块：

- 标题 `more.`（复用站内 Bitcount 展示字体风格，`text-2xl md:text-3xl` 级别即可，小于首页板块标题）+ 副标「相关作品」
- 网格：`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1`，复用 `components/video-card.tsx` 的 `VideoCard`（自带 hover 缩放与简介展开动效）

### 选取逻辑

纯函数 `pickRelatedVideos(videos, currentId, n = 4)`：

1. 候选一：与当前作品同 `category` 且 id 不同，按现有排序（`order asc, createdAt desc`，即 `getVideos()` 返回顺序）
2. 不足 `n` 个时用其余最新作品补齐（排除自身与已选）
3. 全站没有其他作品 → 返回空数组，**板块整体不渲染**

放置位置：纯函数放 `lib/utils.ts`（无副作用、可独立理解、便于测试）。

### 数据流

详情页并行调用已有的缓存函数：

```ts
const [video, videos] = await Promise.all([getVideo(id), getVideos()]);
```

不新增查询、不新增 API。`video` 为 null 时维持现有 `notFound()`。

## 功能 2：News 草稿状态

### Schema

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

迁移名 `add_post_published`。`@default(true)` 保证存量文章全部视为已发布、线上行为不变。构建脚本已含 `prisma migrate deploy`，部署时自动应用。

### 数据层（lib/data.ts）

- 新增 `getPublishedPosts()`：`db.post.findMany({ where: { published: true }, orderBy: { createdAt: "desc" } })`，缓存 tags 同为 `["posts"]`
- 首页 `app/page.tsx` 改用 `getPublishedPosts()`
- admin dashboard（`app/(admin)/dashboard/page.tsx`）已直接 `db.post.findMany` 全量查询，无需改动，天然能看到草稿
- `PostItem` 类型（`lib/types.ts`）加 `published: boolean`

### 公开侧过滤

- 首页 `NewsSection` 组件本身不改（数据源已在页面层过滤）
- `app/news/[id]/page.tsx`：`generateMetadata` 与页面主体查到的 post 若 `!published` → 一律 `notFound()`（不做管理员预览，YAGNI；后台 MarkdownEditor 自带实时预览）

### API

`lib/schemas.ts` 的 `postMutateSchema` 增加 `published: z.boolean().optional()`：

- POST `/api/posts`：未传时默认 `true`（保持"发布直上线"习惯）；传 `false` 即存草稿
- PUT `/api/posts/[id]`：未传时不改动原值（避免普通编辑意外改变状态）；显式传入才覆盖

### 后台 UI（components/admin/post-manager.tsx）

- 编辑器动作区改为两个按钮：「存草稿」（提交 `published:false`）、「发布」（提交 `published:true`）。新建与编辑均适用——对已发布文章点「存草稿」即撤回
- 列表每行：
  - `published === false` 显示「草稿」徽章（复用现有 tag 徽章样式：`border border-yellow-600/60 text-yellow-500`）
  - 操作区新增一键「发布 / 撤回」切换按钮（图标 Eye/EyeOff 或文字按钮均可，与现有 Pencil/Trash2 风格一致），乐观更新 + 失败回滚（模式同现有删除逻辑）
  - 点「编辑」载入草稿后，标题栏提示当前处于草稿态（轻量处理即可，如按钮文案已是双态则可省略）

### 边界情况

- 已公开文章被撤回 → 下次访问详情页 404；`revalidateTags("posts")` 在 PUT 时已调用，列表与详情缓存随之失效
- 短动态与文章同样支持草稿（字段在 Post 级别，与 title 是否为 null 无关）
- 草稿不计入首页「最新动态」前 5 条

## 验收

- `npx tsc --noEmit` 通过；`npx next build` 通过（含 migrate deploy）
- works 详情页底部出现最多 4 个同分类优先的相关作品卡片；无其他作品时该板块隐藏
- 新建动态默认发布上线；「存草稿」后前台首页与详情页均不可见，后台带徽章并可一键切换
- 存量文章行为不变（默认已发布）
