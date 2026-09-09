# nonacola3 Portfolio 重构计划

## 目标

在保留当前视觉方向和已正常工作的功能基础上，逐步改善网站的国内访问成功率、权限一致性、访客与后台的信息架构、可访问性和工程质量。

本计划不以“重写”为目标。每个阶段都应保持可独立发布、可验证、可回滚，避免同时改动性能、视觉和数据结构。

## 基线与约束

- 当前生产域名：`https://www.nonacola3.com`
- 当前部署平台：EdgeOne Pages / Makers
- 数据库：Neon PostgreSQL
- 媒体存储：Vercel Blob
- 框架：Next.js 16.2.9、React 19、Prisma 7.8
- 管理页面已经通过服务端 Layout 校验管理员角色。
- 管理页面与管理 API 均已统一校验 `admin` 角色；访客导航不再渲染管理入口。
- TypeScript 检查通过。
- 首个实施批次涉及文件的 ESLint 检查通过；全项目遗留检查问题留在 Phase 7 处理。
- 不在重构过程中更换整体视觉风格、内容模型或后台技术栈，除非后续数据证明必须更换。

## 当前进度（2026-09-09）

- Phase 0：已完成可重复的只读基线脚本、初始测量及国内 Chrome/HAR 补测；LCP 和多设备截图仍需后续补充。
- Phase 1：1.1、1.2、1.4 已完成并已发布；1.3 登录与上传防护尚未开始。
- Phase 2：2.1 已完成、部署并由国内 Chrome/HAR 验证；2.2 已确认 EdgeOne 静态首页更新后采用手动重新部署；2.3 已决定现阶段保留 Neon；2.4 已完成媒体诊断，详情页预取和新封面 WebP 上传均已在本地完成。
- Phase 3 及以后：未开始。

## 完成标准

整个计划完成时，应满足：

- 未登录访客看不到管理入口，且无法访问管理页面或调用管理 API。
- 访客首页不因数据库短暂变慢而长时间白屏或完全不可用。
- Hero 视频不会阻塞页面主要内容出现。
- 手机、平板和桌面端的主要浏览及管理流程可用。
- 菜单、弹窗、表单和作品卡片可通过键盘使用。
- `prefers-reduced-motion` 用户不会看到持续或强制滚动动画。
- lint、typecheck、生产构建均通过。
- 权限、内容发布、更新和上传至少有关键自动化测试覆盖。

---

## Phase 0：建立测量基线

优先级：P1  
工作量：小  
修改风险：低

状态：基础测量已完成，详见 `docs/performance-baseline.md`；浏览器端真实国内网络指标仍待补充。

### 目的

在优化前记录真实性能和行为基线，避免凭感觉调整，也避免优化后无法判断收益。

### 任务

- 记录国内网络下首页、作品详情和 News 详情的：
  - DNS、连接、TTFB、DOMContentLoaded、LCP。
  - 首屏传输量和 Hero 视频开始下载时间。
  - 数据库冷启动与热缓存响应差异。
- 记录 Hero 视频文件大小、编码、码率和首段可播放耗时。
- 保存手机、平板、桌面三个尺寸的关键页面截图。
- 建立最小检查命令：lint、typecheck、build。

### 验收标准

- 有一份可重复的测试步骤和优化前数据。
- 能区分 HTML/数据库慢、JavaScript 慢和媒体资源慢。

### 回滚点

本阶段只增加检查和记录，不改变运行时行为。

---

## Phase 1：权限与安全收口

优先级：P1  
工作量：中  
修改风险：低至中

### 1.1 隐藏公开管理入口

状态：已完成并发布（`3c1170c`）。

涉及文件：

- `components/navbar.tsx`
- 可能新增服务端会话传递或管理员专用导航组件

任务：

- 未登录访客不渲染“管理”入口。
- 管理员登录后可以从明确位置进入 Dashboard。
- 保留服务端路由与 API 权限校验，不把隐藏按钮当作安全措施。

验收：

- 无痕访问首页时 DOM 中不存在 Dashboard 链接。
- 直接访问 `/dashboard`、`/videos/new`、`/videos/:id/edit` 会跳转到 `/login`。

### 1.2 统一管理员权限检查

状态：已完成并发布（`307e6b2`）。

涉及文件：

- `lib/auth.ts`
- `app/(admin)/dashboard/layout.tsx`
- `app/(admin)/videos/layout.tsx`
- `app/api/**/route.ts`

任务：

- 提供统一的 `requireAdmin` 或等价方法。
- 所有内容写入、删除、排序、上传和 Blob 列表接口检查 `role === "admin"`。
- 统一 401 与 403 的响应语义。

验收：

- 未登录调用返回 401。
- 非管理员会话调用返回 403。
- 管理员正常完成现有操作。

### 1.3 登录与上传防护

状态：未开始，不属于首个实施批次。

涉及文件：

- `lib/auth.ts`
- `app/api/blob-token/route.ts`
- `app/api/upload/route.ts`
- EdgeOne 安全规则

任务：

- 为登录接口增加速率限制。
- 按 Hero、Showreel、封面和文章附件分别限制 MIME、扩展名和大小。
- 默认使用唯一文件名并评估关闭覆盖。
- 对外错误不暴露底层服务消息。

验收：

- 非白名单文件和超限文件在生成上传权限前被拒绝。
- 重复登录失败会触发有限、可恢复的限流。

### 1.4 修复数据更新语义

状态：已完成并发布（`615b2eb`）。

涉及文件：

- `app/api/videos/[id]/route.ts`
- `lib/schemas.ts`

任务：

- 明确选择完整 PUT 或部分 PATCH。
- 未提供的可选字段不得被意外写成 `null`。

验收：

- 单独更新标题不会清空描述、概要、封面和日期。

### 回滚点

- 权限辅助方法与上传限制分别提交。
- 每次提交后验证管理员登录、创建、编辑、删除、排序和上传。

---

## Phase 2：国内访问与首屏性能

优先级：P1  
工作量：中至大  
修改风险：中

### 2.1 解除 Hero 视频对首屏的阻塞

状态：已完成、部署并完成 HTTP 与国内 Chrome/HAR 复测。首页中位 TTFB 从 402 ms 降至 246 ms；HAR 中 DOMContentLoaded 为 1.22–1.78 秒、load 约 2.93–2.97 秒，Hero 视频在约 3–4 秒后才开始请求，已不再阻塞主要内容。

涉及文件：

- `components/hero-video.tsx`
- `components/loading-screen.tsx`
- 媒体资源配置

任务：

- 为 Hero 提供经过压缩的 poster。
- 将视频从 `preload="auto"` 调整为渐进或延后加载。
- 页面主要内容可见性不再依赖视频 `canplay`。
- 对移动端、低带宽和流量节省模式优先显示静态封面。
- Loading Screen 只承担品牌过渡，不承担等待完整媒体的职责。

验收：

- Hero 视频不可用时，用户仍能快速看到标题、导航和作品入口。
- 首屏视频下载不会抢占所有关键请求。
- 视觉上无明显闪烁或布局跳动。

### 2.2 降低访客页面对实时数据库的依赖

状态：已确认平台行为并接受运维方案。公开数据已由 `lib/data.ts` 使用带标签的 `unstable_cache` 缓存，内容写 API 会调用 `revalidateTag`；生产验证显示 `/api/hero` 已返回新 URL 时，EdgeOne 上的静态首页仍包含旧 URL。当前阶段在修改 Hero 或其他首页内容后手动点击重新部署，不增加缓存架构复杂度。

涉及文件：

- `app/page.tsx`
- `lib/data.ts`
- 内容写 API 的缓存刷新逻辑

任务：

- 为访客内容设置明确的缓存策略和刷新周期。
- 内容发布、编辑和删除后主动刷新对应缓存。
- 将“首页内容更新后需要重新部署”作为当前 EdgeOne 运维步骤记录；若更新频率明显提高，再重新评估运行时路径失效或局部动态读取。
- 评估保留“最后一次成功内容”，避免数据库短暂故障造成整站 500。
- 详情页和首页采用一致的缓存失效规则。

验收：

- 热缓存访问不需要等待 Neon 查询。
- 数据库短暂不可达时，已有公开内容仍可访问，或至少快速显示友好错误。
- 管理员更新内容后能在可接受时间内看到新版本。
- 手动重新部署后，访客首页引用最新 Hero、作品、News 与 Showreel 数据。

### 2.3 再决定资源与数据库区域

状态：现阶段保留 Neon，不迁移数据库。国内 HAR 显示首页 HTML 约 263–809 ms、DOMContentLoaded 约 1.0–1.8 秒；主要传输来自 Vercel Blob 媒体。详情 RSC 请求约 0.4–1.5 秒，值得减少无意预取，但不足以证明更换数据库的收益能覆盖迁移风险。

任务：

- 基于 Phase 0 和 Phase 2.1/2.2 后的数据判断瓶颈。
- 如果媒体仍是主要瓶颈，再迁移或复制到国内友好的对象存储/CDN。
- 如果数据库仍是主要瓶颈，再评估更近区域、只读副本或内容静态化。

原则：

- 不在没有测量结果时同时迁移数据库和媒体。
- 优先采用低成本、可撤销的缓存和资源策略。

### 2.4 缩略图、详情预取与 Hero 资源

状态：详情页预取和新封面 WebP 上传已在本地完成并通过目标 lint、typecheck 与生产构建，待发布后验证。Hero 压缩由管理员通过新文件名和 Fast Start 处理。

测量结论：

- 单次冷加载中，网站自身资源约 0.33 MiB，Vercel Blob 资源约 9.15 MiB。
- Hero 视频原文件约 8.07 MiB；延后加载已保护首屏，但完整播放仍可能需要 30 秒以上下载。
- 首页 Blob 缩略图合计约 1.10 MiB。现有 URL 尾部的 `imageMogr2/thumbnail/.../format/webp` 参数未被 Vercel Blob 执行，响应仍是 126–264 KiB 的 JPEG。
- 首页会自动预取几乎所有作品和 News 详情，产生多轮动态 RSC 请求；部分请求耗时约 1.2–1.5 秒。
- 新 Hero 已上传到数据库，但静态首页缓存未刷新；部署前的 HAR 仍请求旧文件，不能用于评价压缩版速度。

任务：

- 新上传的 JPEG、PNG 或 WebP 封面在浏览器端缩放到最长边不超过 960 px，并转换为质量约 80% 的 WebP；保留外部 URL 输入能力。
- 限制原图不超过 20 MiB，转换或解码失败时向管理员显示明确错误。
- 本批次不自动批量改写生产数据；现有封面可在后续编辑作品时逐个替换。
- 作品卡片和 News 链接关闭视口自动预取；移除点击作品时紧接 `router.push` 前的冗余 `router.prefetch`。
- 保持 Hero 延后加载策略；压缩视频必须使用新 Blob URL，并启用 MP4 Fast Start。

验收：

- 新上传封面响应为 WebP，最长边不超过 960 px，视觉无明显劣化。
- 首页空闲停留时不再批量请求所有 `/works/:id` 与 `/news/:id` RSC。
- 点击作品和 News 后导航及现有过渡动画正常。
- 新 Hero URL、ETag 与文件大小在生产 Network 中可明确识别，不再因覆盖旧 URL 命中旧缓存。

### 回滚点

- Poster/视频加载策略、数据缓存策略、资源迁移分别提交。
- 缓存策略上线前保留原查询路径作为快速回退方案。

---

## Phase 3：访客端与管理端分离

优先级：P1  
工作量：中  
修改风险：中

### 目的

让访客体验与后台操作形成清楚边界，同时减少后台加载无关动画和组件。

### 任务

- 建立访客路由 Layout，负责：
  - 作品集 Navbar。
  - 页面过渡。
  - 面向访客的通知。
- 建立管理路由 Layout，负责：
  - 管理员身份验证。
  - Dashboard 导航。
  - 返回网站与登出入口。
- 登录页使用简洁独立布局。
- 后台不加载 Hero、访客菜单、服务器通知和访客页面过渡。
- 修复窄屏登录卡片溢出。

### 验收标准

- 访客页面没有后台操作入口。
- 登录页没有作品集菜单或访客通知干扰。
- 后台清楚显示当前处于管理模式，并可安全登出。
- 所有现有 URL 保持有效。

### 回滚点

- 先增加新 Layout，再逐步迁移页面；不一次性移动所有文件。

---

## Phase 4：可访问性与交互稳定性

优先级：P2  
工作量：中  
修改风险：中

### 4.1 恢复可预测的滚动行为

涉及文件：

- `components/home-client.tsx`
- `components/navbar.tsx`
- `app/globals.css`

任务：

- 优先评估恢复浏览器原生滚动。
- 页面锚点可以保留平滑滚动。
- 不隐藏系统滚动条。
- 不无条件拦截 Space、PageUp、PageDown、Home、End。
- 若保留自定义惯性，必须支持 breakpoint 变化和 reduced motion。

验收：

- 鼠标、触控板、触屏和键盘都能稳定滚动。
- 浏览器查找、后退恢复和锚点跳转正常。

### 4.2 完善菜单和弹窗

涉及文件：

- `components/navbar.tsx`
- `components/showreel-modal.tsx`
- `components/ui/dialog.tsx`

任务：

- 菜单增加 `aria-expanded`、`aria-controls`、Escape 关闭和焦点还原。
- Showreel 使用已有 Dialog，或补齐 dialog 语义与焦点锁定。
- 关闭按钮提供可访问名称。

验收：

- 仅使用键盘可以打开、浏览和关闭菜单及弹窗。
- 弹窗开启时焦点不会进入背景页面。

### 4.3 为触屏和键盘提供 hover 等价体验

涉及文件：

- `components/video-card.tsx`
- `components/video-grid.tsx`
- `components/category-filter.tsx`

任务：

- 卡片概要支持 focus 状态。
- 在触屏布局中直接显示必要概要，或提供清楚的详情提示。
- 当前筛选按钮使用 `aria-pressed`。
- 筛选结果为空时显示明确空状态。

验收：

- 不使用鼠标也能获得与 hover 相同的关键信息。

### 4.4 全局 reduced motion

涉及文件：

- `app/globals.css`
- `components/hero-video.tsx`
- `components/progress-bar.tsx`
- `components/navbar.tsx`

任务：

- reduced-motion 下停止 Marquee。
- 禁止自动“轻推”页面。
- 缩短或取消非必要菜单、页面和弹窗动画。

### 回滚点

- 滚动、菜单、弹窗、卡片和 reduced motion 分开提交。

---

## Phase 5：客户端边界与代码结构

优先级：P2  
工作量：中  
修改风险：中

### 5.1 缩小首页客户端边界

涉及文件：

- `app/page.tsx`
- `components/home-client.tsx`
- `components/news-section.tsx`
- `components/about-section.tsx`
- `components/footer.tsx`

任务：

- News、About、Footer 保持服务端组件。
- Hero 和作品交互保留为小型客户端岛。
- 将滚动控制器与内容渲染解耦。
- 避免把完整文章正文等非首屏数据无必要地序列化到客户端。

验收：

- 首页交互保持不变。
- 客户端 JavaScript 与 hydration 范围下降。

### 5.2 抽取重复上传逻辑

涉及文件：

- `components/admin/hero-upload.tsx`
- `components/admin/showreel-settings.tsx`
- `components/admin/video-form.tsx`
- `components/markdown-editor.tsx`

任务：

- 只抽取已经重复出现的：上传进度、错误处理、Blob 文件选择和文件类型判断。
- 保留各业务组件自己的表单和文案。
- 不建设通用表单框架。

验收：

- 上传流程行为保持一致。
- 重复逻辑减少，业务组件职责更清楚。

### 5.3 统一 API 错误处理

任务：

- 统一非法 JSON、Schema 错误、未找到、冲突和服务器错误。
- 客户端能够显示可行动的错误信息。
- 服务端保留可诊断日志，对外不泄露内部错误。

### 回滚点

- 每个共享抽象只迁移一个调用方验证后，再迁移剩余调用方。

---

## Phase 6：Design System 与视觉清理

优先级：P3  
工作量：小至中  
修改风险：低

### 任务

- token 化反复出现且具有语义的值：
  - 页面背景。
  - 常用边框颜色。
  - 页面水平 gutter。
  - Navbar 高度。
  - 常用动画时长和 easing。
- 删除重复的 `slide-in-right` keyframes。
- 保留特殊视觉效果所需的局部 magic numbers，不追求消灭所有任意值。
- 修正 `MarkdownBody` 的 `" poster"` 属性 typo。
- 改善 Markdown 图片 lazy loading、尺寸稳定性和列表排版。
- 删除或更新过时文案：
  - `HOST: VERCEL`
  - `Deployed on Vercel`
- 将服务器通知文章 ID 移出组件硬编码；无有效文章时不显示链接。
- 统一后台“News / 动态 / 文章”等命名。
- 将年份筛选组件从 `CategoryFilter` 改为准确名称。

### 验收标准

- 视觉表现无意外变化。
- 常用间距、颜色和动效参数来源清楚。
- 页面不再显示错误的托管平台信息。

### 回滚点

- 文案、CSS 清理、Markdown 排版分别提交。

---

## Phase 7：工程质量与回归保护

优先级：P2  
工作量：中  
修改风险：低

### 7.1 清零现有静态检查问题

当前已知：

- ESLint：7 errors、12 warnings。
- TypeScript：通过。

任务：

- 移除显式 `any`。
- 修复 Effect 中同步 setState 警告。
- 避免 render 阶段调用不纯函数。
- 修复 Hook dependency 警告。
- 移除未使用变量和 import。
- 为 `package.json` 增加 `lint`、`typecheck` 和测试命令。

### 7.2 拆分构建与数据库迁移

涉及文件：

- `package.json`
- 部署配置

任务：

- `build` 只负责生成 Prisma Client 和构建应用。
- 数据库迁移使用独立、明确的部署步骤。
- 确认 Vercel 与 EdgeOne 的执行顺序后再切换。

### 7.3 添加关键测试

优先覆盖：

1. 未登录和非管理员不能调用写 API。
2. 草稿文章不能通过公开详情页访问。
3. 部分更新视频不会清空其他字段。
4. 发布、编辑、删除后缓存正确刷新。
5. 上传类型和大小限制。
6. Markdown 危险 HTML 被清理。
7. Dashboard 路由保护。

不优先覆盖：

- 纯视觉动画的每一个中间帧。
- UI 库内部已经覆盖的行为。

### 验收标准

- lint、typecheck、测试、生产构建全部通过。
- CI 中的构建不会隐式修改数据库。

---

## 建议提交顺序

每一项使用独立、可回滚的提交：

1. `fix(auth): hide admin entry from visitors`
2. `fix(auth): enforce admin role across management APIs`
3. `fix(upload): validate media type and size`
4. `fix(api): preserve omitted video fields on update`
5. `perf(hero): decouple page visibility from video loading`
6. `fix(cache): refresh public pages after content updates`
7. `perf(nav): stop eager detail-page prefetching`
8. `refactor(layout): separate public and admin shells`
9. `fix(a11y): improve menu and modal keyboard behavior`
10. `fix(a11y): support focus and reduced motion states`
11. `refactor(home): reduce client component boundary`
12. `refactor(upload): share repeated blob upload behavior`
13. `chore(css): consolidate repeated design tokens`
14. `test: cover auth content updates and uploads`
15. `chore(build): separate migrations from application build`

## 每次发布后的验证清单

- 无痕访问：首页、作品详情、News 详情正常。
- 无痕访问 `/dashboard` 会跳转登录页。
- 访客导航没有管理入口。
- 管理员可以登录、登出、创建、编辑、删除和排序。
- Hero、Showreel、封面和文章图片上传正常。
- 草稿不会公开显示。
- 手机宽度无横向滚动。
- 键盘可操作菜单、弹窗、筛选和主要链接。
- reduced-motion 下没有持续 Marquee 或自动页面轻推。
- 数据库或媒体请求缓慢时，页面仍有明确且可用的反馈。
- `lint`、`typecheck`、测试和生产构建通过。

## 暂不建议进行的工作

- 不重做当前黑白视觉风格。
- 不为了统一而替换全部 UI 组件。
- 不立即迁移数据库和所有媒体资源。
- 不把后台重写成通用 CMS。
- 不为很小的组件建立复杂抽象。
- 不在没有测量数据时加入更多 loading 动画。

## 推荐的首个实施批次

状态：已完成并发布。

首批建议只处理以下四项：

1. 对访客隐藏管理入口。
2. 统一管理员 API 权限校验。
3. 修复视频部分更新可能清空字段的问题。
4. 建立性能测量基线，并确认 Hero 文件大小与数据库 TTFB。

这批改动范围清晰、风险可控，可以先关闭最明显的产品与权限缺口，同时为下一批性能优化提供可靠依据。

## 第二个实施批次（已批准执行）

审查后保留两个独立代码任务，仍属于 Phase 2：

1. **停止详情页批量自动预取**
   - 为作品和 News 链接关闭自动预取，删除点击前无法及时完成的手动预取。
   - 不修改页面过渡视觉或详情页结构。
   - 风险：低；工作量：小。
2. **为新上传封面生成 WebP**
   - 在浏览器端将 JPEG、PNG 或 WebP 缩放到最长边 960 px，并转换为 WebP 80%。
   - 保留手动 URL 输入，不批量修改现有生产记录。
   - 风险：中；工作量：中。
3. **发布后复测**
   - 使用相同 HAR 方法复测首页传输量、动态 RSC 数量和新 Hero URL。
   - 只有压缩后的 Hero 在国内仍明显缓慢，才评估迁移到国内友好的对象存储/CDN。
   - 数据库迁移不在本批次范围内。
   - 风险：低；工作量：小。

审查决定：封面显示尺寸较小，适合在上传时积极缩放和转换；EdgeOne 重新部署成本可接受，暂不实现运行时首页失效。预取与封面改动分别独立提交并验证目标 lint、typecheck、生产构建；生产验证不删除或批量覆盖现有内容。
