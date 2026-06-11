# 视频作品集网站设计文档

**日期：** 2026-06-12  
**项目：** 个人视频作品集网站（vibecoding）

---

## 1. 项目目标

构建一个面向潜在客户和同行创作者的视频作品集展示网站，具备以下核心特性：
- 暗色系、电影感视觉风格
- 支持多种视频类型展示，可按分类筛选
- 全屏 Hero 视频背景 + 大标题
- 视频嵌入 YouTube/Bilibili
- 管理员后台，可登录管理视频内容

---

## 2. 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 15 (App Router) + TypeScript |
| 样式 | Tailwind CSS + shadcn/ui |
| 数据库 | Prisma ORM + SQLite（开发）/ PostgreSQL（生产，Neon 免费层）|
| 认证 | NextAuth.js v5（用户名/密码，单管理员账号）|
| 文件存储 | Vercel Blob（Hero 视频 mp4 上传，免费层 1GB）|
| 部署 | Vercel（免费）|

---

## 3. 项目结构

```
/app
  /(public)
    /page.tsx              — 首页（Hero + 视频网格）
    /work/[id]/page.tsx    — 视频详情页（备用，主要用 Modal）
  /(admin)
    /login/page.tsx        — 管理员登录页
    /dashboard/page.tsx    — 后台首页
    /videos/new/page.tsx   — 添加视频
    /videos/[id]/edit/page.tsx — 编辑视频
  /api
    /auth/[...nextauth]    — NextAuth 路由
    /videos                — 视频 CRUD API
    /upload                — Vercel Blob 上传接口
/components
  /hero-video.tsx          — 首页全屏背景视频组件
  /video-grid.tsx          — 视频卡片网格
  /video-card.tsx          — 单个视频卡片
  /video-modal.tsx         — 点击播放的弹窗
  /category-filter.tsx     — 分类筛选标签
  /admin/                  — 后台专用组件
/lib
  /db.ts                   — Prisma 客户端
  /auth.ts                 — NextAuth 配置
/prisma
  /schema.prisma           — 数据库模型
```

---

## 4. 数据模型

```prisma
model Video {
  id          String   @id @default(cuid())
  title       String
  description String?
  category    String
  embedUrl    String
  thumbnail   String?
  featured    Boolean  @default(false)
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model HeroVideo {
  id        String   @id @default("singleton")
  blobUrl   String
  updatedAt DateTime @updatedAt
}
```

说明：
- `Video.embedUrl`：YouTube 或 Bilibili 嵌入 URL
- `Video.thumbnail`：可选，不填则从嵌入平台自动提取封面
- `Video.category`：直接存字符串，如"商业广告"、"短片"、"纪录片"
- `HeroVideo`：单条记录，存当前 Hero 视频的 Vercel Blob URL

---

## 5. 页面设计

### 5.1 首页（访客）

**Hero 区域（全屏）：**
- `<video>` 标签，自动播放、静音、循环，src 来自 Vercel Blob
- 叠加半透明暗色遮罩
- 居中显示名字/品牌大标题 + 副标题
- 向下箭头引导滚动

**视频网格区域：**
- 暗色背景（`#0a0a0a` 或类似）
- 顶部分类筛选标签（"全部" + 各分类名称），客户端即时筛选
- 响应式网格：桌面 3 列，平板 2 列，手机 1 列
- 每个卡片：封面图 + 悬停显示标题/描述/播放按钮
- 点击卡片弹出 Modal，内嵌 YouTube/Bilibili 播放器

### 5.2 联系页 / 联系区块

- 显示邮箱地址（可点击 `mailto:` 链接）
- 可以是独立页面 `/contact`，也可以是首页底部的一个区块
- 社交媒体图标链接：Bilibili、YouTube、小红书、X (Twitter)，图标可点击跳转，链接配置在环境变量或配置文件中

### 5.3 视频 Modal

- 全屏暗色遮罩
- 居中 iframe 嵌入播放器（16:9 比例）
- 下方显示标题、描述、分类标签
- ESC 键或点击遮罩关闭

### 5.3 后台登录页

- 简洁居中表单，用户名 + 密码
- 认证失败显示错误提示
- 登录成功跳转 `/dashboard`

### 5.4 后台 Dashboard

- 视频列表表格：标题、分类、是否精选、排序权重、操作（编辑/删除）
- 顶部按钮：添加新视频、上传/更换 Hero 视频
- 拖拽排序（可选，优先级低）

### 5.5 添加/编辑视频表单

字段：
- 标题（必填）
- 分类（必填，文本输入 + 已有分类下拉建议）
- 嵌入链接（必填，YouTube/Bilibili URL）
- 封面图 URL（选填）
- 描述（选填，多行文本）
- 是否精选（开关）
- 排序权重（数字）

---

## 6. 认证设计

- NextAuth.js Credentials Provider
- 管理员用户名/密码存环境变量（`ADMIN_USERNAME`、`ADMIN_PASSWORD`）
- 不开放注册
- 后台所有路由 `/(admin)/*` 通过 middleware 保护，未登录重定向 `/login`

---

## 7. 文件上传设计

- Hero 视频通过后台界面上传 mp4 文件
- 上传接口调用 Vercel Blob `put()` 存储文件
- 上传成功后将 Blob URL 写入 `HeroVideo` 表
- 前台首页读取 `HeroVideo` 记录获取视频 URL

---

## 8. 部署

1. 推送代码到 GitHub
2. Vercel 连接 GitHub 仓库，自动部署
3. 配置环境变量：
   - `DATABASE_URL`（Neon PostgreSQL 连接字符串）
   - `NEXTAUTH_SECRET`
   - `ADMIN_USERNAME` / `ADMIN_PASSWORD`
   - `BLOB_READ_WRITE_TOKEN`（Vercel Blob）
4. 运行 `prisma migrate deploy` 初始化数据库

---

## 9. 不在范围内（YAGNI）

- 多管理员账号 / 权限系统
- 评论功能
- SEO 高级优化（基础 meta 即可）
- 国际化（i18n）— 预留扩展，当前不实现；所有页面文案集中管理（不硬编码散落各处），以便未来低成本接入
- 视频分析统计
- ~~联系表单~~ → **在范围内**（见第 5 节，显示邮箱地址，不做表单提交）
