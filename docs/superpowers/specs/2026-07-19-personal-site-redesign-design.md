# 个人网站化重构 v2 设计文档

**日期**：2026-07-19
**状态**：已获用户批准
**背景**：网站从「视频作品集」扩展为「个人网站」。现有站点为 Next.js 16 (App Router) + Tailwind 4 + Prisma (PostgreSQL/Neon) + NextAuth + Vercel Blob，单页 + 独立 about 页结构。

## 需求来源

用户的四点核心诉求：

1. 增加类似博客的最新动态（News）功能
2. 首页作品区改为循环滚动一行 + 「显示全部」开关
3. 关于我页面不易被发现，整合进主页作为板块
4. 网站样式单调，需要风格刷新

后续补充：视频详情改独立页面、文章详情页（Markdown）、页面过渡增强 + 交互微动效、完善社交链接。

## 风格方向

**纯黑白单色暗黑**（经 visual companion 三方向对比后选定 B 方向排版 + 无彩色点缀）：

- 底色 `#0a0a0a`，文字 neutral 灰阶 + 纯白，**无彩色点缀**
- 视觉刷新靠排版驱动：板块大标题（`works.` `news.` `about.` + 灰色句点）、等宽字体日期、细分隔线、uppercase 宽字距小标签
- 保留：噪点纹理、边框按钮语言、Loading 屏、黑场过渡

## 页面结构

### 主页（单页，顺序固定）

```
Hero（不变：视频背景 + Montserrat 标题 + 跳转按钮 + 视差/亮度滚动效果）
  ↓
works.
  - REEL 条（保留现状，点击开 ShowreelModal）
  - 循环滚动行：全部作品按 order 排列，marquee 自动缓慢横向滚动，悬停暂停
  - 「显示全部作品 ⌄ (数量)」开关：原地展开为现有完整网格（grid-cols-2 lg:grid-cols-4，gap-1，保留年份筛选），再点收起回到循环行
  ↓
news.
  - 最近 5 条动态，倒序
  - 每行：等宽字体日期（MM.DD）+ 内容 + 可选分类小标签（如 作品/日常/活动）
  - 短动态：一句话直接显示
  - 文章：显示标题 +「阅读全文 →」链接到详情页
  ↓
about.
  - 左栏：个人简介（沿用现有 bio 文案）
  - 右栏：联系方式（email + 社交链接，真实链接见下文）
  ↓
Footer（不变）
```

### 视频详情页 `/works/[id]`（新，替代 VideoModal 弹窗）

- 主页点击作品卡片 → PageTransition 黑场 → 独立页面（可分享链接、利于 SEO）
- 布局（居中列，大留白）：
  - 16:9 大播放器（YouTube/Bilibili iframe 嵌入，或上传视频 `<video>` 直链，复用现有判断逻辑）
  - 大标题 → 分类 · 日期 → summary → description（保留换行）
  - 「跳转至视频 ↗」外链按钮 + 返回
- `generateMetadata` 输出视频标题/简介
- 数据：`getVideo(id)`，unstable_cache，tag `videos`
- **删除 `components/video-modal.tsx`**；`components/showreel-modal.tsx` 保留不变

### News 详情页 `/news/[id]`（新）

- 仅「文章」类型有详情页；短动态无
- 布局：标题 + 日期/标签 + Markdown 正文 + 返回
- Markdown 渲染：`react-markdown` + `remark-gfm`，自定义组件映射保持黑白风（标题/列表/链接/代码/引用）
- `generateMetadata` 输出文章标题

### 移除

- `/about` 独立页面删除（内容并入主页 about. 板块）

## 动效设计

### 页面过渡增强

- **共享元素过渡**：作品卡片缩略图 → `/works/[id]` 播放器区域，使用 View Transitions API（`document.startViewTransition` + `view-transition-name`）平滑飞入
- 浏览器不支持 View Transitions 时回退到现有黑场 PageTransition
- 其他页面间导航（news 详情等）保留现有黑场 fade
- 页内锚点跳转保留现有惯性滚动

### 交互微动效（统一 200–300ms ease-out）

- 导航/文本链接 hover：下划线从左向右扫入
- 作品卡片 hover：缩略图 `scale(1.02)` + 微提亮（在现有 hover 层基础上增强）
- 按钮 hover：边框提亮 + 箭头位移（推广现有 hero 按钮语言到全站按钮）
- news 行 hover：整行微亮 + 左侧指示条滑入

## 数据模型

### Post（新增）

```prisma
model Post {
  id        String   @id @default(cuid())
  title     String?              // 空 = 短动态；非空 = 文章（有详情页）
  body      String               // 短动态的一句话 或 文章的 Markdown 全文
  tag       String?              // 可选分类标签（自由文本：作品/日常/活动…）
  createdAt DateTime @default(now())
}
```

### Video（不变）

现有字段沿用：`id / title / summary / description / category / date / embedUrl / videoUrl / thumbnail / order / createdAt / updatedAt`

## API

| 路由 | 方法 | 鉴权 | 说明 |
|---|---|---|---|
| `/api/posts` | GET | 公开 | 全部动态倒序 |
| `/api/posts` | POST | ✓ | 创建（title?/body/tag?），`revalidateTag("posts","max")` |
| `/api/posts/[id]` | DELETE | ✓ | 删除，`revalidateTag("posts","max")` |

视频相关 API 不变。

## 服务端数据层（lib/data.ts）

- `getPosts()` — 全部 Post 倒序，unstable_cache tag `posts`
- `getVideos()` — 现有
- `getVideo(id)` — 单个视频，unstable_cache tag `videos`
- `getHero()` / `getShowreel()` — 现有

## 后台（Dashboard）

- 新增 News 管理区（视频管理下方或独立区块）：
  - 发布框：短动态/文章切换（toggle）、文章模式下显示标题输入、body textarea、tag 输入（可选）
  - 列表：日期 + 内容预览 + 删除按钮
  - 无 Markdown 预览（YAGNI）

## 导航

- 导航栏：站点名 + **WORKS / NEWS / ABOUT 页内锚点**（复用 smooth-scroll-to 惯性滚动）+ 管理
- 移除 /about 链接

## 社交链接（lib/config.ts 更新为真实链接）

- Bilibili: https://space.bilibili.com/13361398
- YouTube: https://www.youtube.com/@nonacola3
- X: https://x.com/nonacola3
- 小红书: https://xhslink.com/m/4oYQKJkJs3z
- Email: lsnano@vip.qq.com（不变）

## SEO / 其他

- `/works/[id]`、`/news/[id]` 允许索引；`robots.ts` 无需变动（仅 disallow 后台）
- 新依赖：`react-markdown`、`remark-gfm`
- 移动端：循环行正常工作；展开网格 2 列；详情页单列

## 明确不做（YAGNI）

- 滚动入场动效、Hero 开场动效
- Markdown 预览、分页、评论、标签筛选
- 循环行拖拽滚动（仅自动 + 悬停暂停）
- 视频/动态的多图、附件

## 错误处理

- `/works/[id]`、`/news/[id]` 找不到记录 → `notFound()`（Next 内建 404 页）
- posts API 参数缺失（body 为空）→ 400
- View Transitions 不可用 → 静默回退黑场过渡，无报错

## 测试 / 验证

- `npx tsc --noEmit`、`npm run lint`、`npm run build` 全绿
- 手动验证：主页四板块顺序与锚点、循环行滚动/悬停暂停/展开收起、作品卡片 → 详情页共享元素过渡（及回退）、news 发布/删除/详情页 Markdown 渲染、社交链接正确
