# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## 项目

nonacola3 个人视频作品集（https://www.nonacola3.com/）。Next.js 16.2 App Router + React 19 + TypeScript + Tailwind CSS 4（shadcn/Base UI 组件在 `components/ui`）；Prisma 7 + PostgreSQL（Neon，通过 `@prisma/adapter-pg`）；媒体存 Vercel Blob；next-auth v5；部署在 EdgeOne Pages（`edgeone.json`）。用户默认使用中文交流。

当前进度与未确认事项见 `HANDOFF.md`；每轮工作的设计/计划在 `docs/superpowers/specs|plans/`（计划里的待办框未勾选不代表未实施，以提交和代码为准）。

## 常用命令

- `npm run dev` — 开发服务器
- `npm test` — 全部测试（`tsx --test tests/**/*.test.ts`，Node 内置 test runner）
- 单个文件：`npx tsx --test tests/admin-works.test.ts`；按名称过滤：加 `--test-name-pattern="<名称>"`
- `npx tsc --noEmit`、`npx eslint .`（有 5 条既有 warning）
- 构建检查：`npx next build --webpack`。**不要运行 `npm run build`**：它会先执行 `prisma migrate deploy`，改动数据库。本地数据库常不可用，预渲染 `/dashboard/settings` 可能报 `ECONNREFUSED`，出现这种情况不能说构建通过。
- `postinstall` 会自动执行 `prisma generate`；schema 改动要在 `prisma/migrations/` 下新增迁移。

## 架构

**数据模型**（`prisma/schema.prisma`）：`Video`（前台叫 Works）、`Post`（News；`title === null` 为短动态，否则是文章，两者用不同编辑器）、`HeroVideo` 和 `Showreel`（都是 `id = "singleton"` 的单行配置）。

**读取与缓存**：前台读取统一走 `lib/data.ts`，用 `unstable_cache` 包装并打上标签（`videos` / `posts` / `hero` / `showreel`）。所有写操作在 API 路由里完成，写完调用 `lib/api-utils.ts` 的 `revalidateTags(...)`。新增写入路径时必须让对应标签失效，否则前台不会更新。

**鉴权共有三层，新增后台页面或 API 时都要覆盖**：
1. `proxy.ts`（Next 16 用它取代 middleware）：未登录访问 `/dashboard`、`/videos` 时跳转到 `/login`。
2. `app/(admin)/dashboard/layout.tsx`：服务端校验 `role === "admin"`。
3. 每个会写入的 API 路由开头调用 `requireAdmin()`（`lib/api-auth.ts`），返回值非空就直接返回。

登录方式是 Credentials，账号密码只来自环境变量 `ADMIN_USERNAME` / `ADMIN_PASSWORD`，session 用 JWT。

**后台 Dashboard**（`app/(admin)/dashboard/*`）：页面是服务端组件，直接读 `db` 后把数据交给 `components/admin/*` 里的客户端编辑器；编辑器通过 `fetch` 调 `/api/videos`、`/api/posts`、`/api/hero`、`/api/showreel`、`/api/videos/reorder`、`/api/media` 保存。请求体在 `lib/schemas.ts` 里用 zod 校验；错误统一返回 `{ error }`，由 `api-utils` 的 `ok/created/fail` 系列函数生成。`app/(admin)/videos/*` 是旧路由，只做重定向。

**纯逻辑与 UI 分离**：表单状态、reducer、payload 构造、过滤排序、未保存提示等逻辑放在 `lib/admin-*.ts`（服务端专用的是 `*.server.ts`），测试直接导入这些模块验证，UI 部分用 `renderToStaticMarkup` 断言。改后台行为时，优先改这些 lib 文件并补测试。

**媒体**：上传有两条路，`/api/upload`（服务端 `put`）和 `/api/blob-token`（客户端直传 `handleUpload`）。`/api/media` 删除文件前，服务端会复核引用（作品缩略图、Hero 视频与封面、Showreel），新增引用类型时要同步加进复核。Hero 的 `posterUrl` 可选，没配置时用 `/hero-poster.webp`；旧客户端不传 `posterUrl` 时不能清空已存的封面。

**前台**：`app/layout.tsx` 挂载 Navbar、ServerNotice、PageTransition（黑场/缩略图飞入过渡，Dashboard 内跳转时跳过）和 ChunkRecovery。首页由 `components/home-client.tsx` 组装。`/works` 索引在 `components/works-index/`，界面固定文字的中英切换由 `works-language-provider` 和 `lib/works-copy.ts` 负责，作品内容本身不翻译。

**滚动前提**：桌面端首页在 `#main-scroll` 容器里滚动（`md:h-screen md:overflow-y-auto`），移动端才是整个窗口滚动。改滚动、视差、揭示动画时两种情况都要考虑。

**字体**：`font-heading` 依赖 `--font-heading: var(--font-bitcount)`；该字体在本地 dev 下可能不生效，线上正常。

**已知遗留问题**：本地 dev 下 Hero 视频（Vercel Blob）加载不出，线上正常；用户要求暂不修。

## Git 约定

- 用户说"push"，指把完成的改动合入并推送到 `master`，不只是推功能分支。推之前核对分支、diff、测试和远端状态。
- 不要 `git add -A`，只提交本次相关的文件。以下文件不得提交、删除或移动：`.env`、`.opencode/`、`start-dsh.ps1`、`.superpowers/`、`dev-server.log`、`handoff-mobile-layout.json`、`.playwright-cli/`、`tmp/`（里面有用户的视频）。
- 不要强制删除现有的 worktree（`C:\Users\theko\.codex\worktrees\dashboard-frontend-polish\2`，以及 `.worktrees/` 下的目录）。
- 没有实际验证过的事项要如实标为未验证；不要绕过登录，不要对生产数据做写入测试。
- 视觉或排版改动先和用户对齐整体方向，不要零碎地一条条改（以前因为这样整轮被回退过）。
