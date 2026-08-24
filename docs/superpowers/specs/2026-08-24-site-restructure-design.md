# 站点重构：Hero 入场简化 + Works 独立页 + 首页重组 设计

- 日期：2026-08-24
- 范围：视觉/交互重设计（技术栈不变）——首屏入场动画简化、works 拆独立页、首页信息架构重排、导航混合模型
- 状态：设计已与用户逐项确认
- 明确不做：news 区不动；技术栈更换；页面滚动模型统一化

## 背景与动机

用户痛点：①首屏入场动画过于复杂（加载屏 INFO 面板/进度条/开场轻推），想要"logo 淡入 → 页面淡入"两步；②主页承载功能过多——works 拆成独立页面 `/works`，about 上移，首页保留 works 精选预览入口；③contact 只在页底不够明显——导航加入口。

## 实现路径

最小侵入拆分：`/works` 用 window 滚动的独立 Server Component 页（不复用首页 `#main-scroll` 容器滚动机制）；首页删除 VideoGrid 换轻量预览块；既有机制（lerp 滚动、锚点跳转、克隆飞入过渡、pending-scroll 回跳）按需保留。

## §1 Hero 入场简化

- **删除**：LoadingScreen 引用与组件使用、flicker 动画依赖、playNudge 开场轻推逻辑、按钮 intro 门控（introDoneRef/pointerEvents 编排）
- **新流程**：layout 内联 pre-loader 黑底保留（防闪）→ React 接管后显示居中 logo（siteConfig.name，`var(--font-bitcount)`）淡入 ~500ms → 停留 ~400ms → 整层淡出 ~450ms 露出页面
- **视频不阻塞入场**：hero 视频后台继续加载，就绪后沿用现有 opacity 过渡自行浮现
- **回访**：sessionStorage `hero-loaded` 存在时直接跳过 logo 层
- **CTA**：「跳转至 works.」改为 `Link href="/works"`（走黑场路由过渡）
- sessionStorage 写入时机：logo 层走完即写 `hero-loaded`

## §2 `/works` 独立页面

结构：`app/works/page.tsx`（Server Component，`getVideos()` 取数）+ `components/works-client.tsx`（视图状态机）。

- 顶部：标题「works.」（Bitcount 字体风格）+ 副标 + 视图切换按钮（lucide `Rows3` / `Grid2x2`）
- showreel 横条保留在标题区之下
- **沉浸模式（默认）**：作品全宽大卡（`aspect-[21/9]`，`max-w-6xl mx-auto` 内）纵向铺开；分类+标题悬浮左下（渐变遮罩保可读）；hover 缩略图轻缩放；整卡 Link 进详情并带 `data-vt-id={video.id}`（克隆飞入过渡生效）
- **紧凑模式**：均匀网格（`sm:2 lg:4` 列，复用 VideoCard）+ 年份筛选（复用 CategoryFilter）；切换动画沿用 `animate-works-expand/collapse`
- 切换按钮固定在标题行右侧；视图 state 仅存内存（不持久化）
- metadata：title「Works」

## §3 首页重组

新顺序：**HeroVideo → AboutSection → NewsSection → WorksPreview → Footer**

- **WorksPreview**（新组件）：标题行「works.」+ 按现有 `getVideos()` 排序的前 4 个作品 VideoCard（`sm:2 lg:4` 网格）+「查看全部作品 →」链接按钮（→ `/works`）
- **AboutSection 上移**至 hero 之后；其联系子块加 `id="contact"`；`id="about"` 保留在 section 上
- NewsSection 不动（`id="news"` 保留）
- 旧 `video-grid.tsx` / `works-marquee.tsx` 从首页移除；CategoryFilter 迁往 /works 复用；showreel-modal 随 /works 使用（showreel 按钮从首页迁出）

## §4 Navbar 混合导航

导航项模型从纯锚点改为混合：

| 项 | 行为 |
|----|------|
| WORKS | 路由跳转 `/works`（黑场过渡） |
| NEWS | 锚点滚到 `#news`（不在首页时经 pending-scroll 跳回首页再滚） |
| ABOUT | 锚点滚到 `#about`（同上） |
| CONTACT | 锚点滚到 `#contact`（同上） |

桌面右侧面板与移动全屏菜单同步渲染四项。管理入口保持现状。

## §5 数据与清理

- 首页 `app/page.tsx` 仍取 `getVideos()` 全量传给 HomeClient（预览取前 4；排序沿用现有 order asc + createdAt desc）
- `/works/page.tsx` 自行调用 `getVideos()`
- 删除不再使用的组件文件与其 CSS keyframes（marquee 相关），避免死代码

## §6 错误处理与边界

- 视频未就绪时入场照常完成（黑底渐变兜底已有）
- `/works` 无作品时：沉浸/网格均渲染空态提示「暂无作品。」
- 锚点目标不存在（跨页回跳时序）：沿用现有 pending-scroll 300ms 重试机制
- 克隆飞入的 `[data-vt-player]` 探测在 /works 详情页不变

## 验收

- `npx tsc --noEmit` 与 `npx next build` 通过
- 手动清单：
  1. 首访：logo 淡入 → 页面淡出显现；回访直接进入
  2. Hero CTA 与导航 WORKS 均进 `/works`；预览卡点击进详情且克隆飞入正常
  3. `/works` 默认沉浸流，切换按钮换网格+年份筛选，再切回正常
  4. 导航 NEWS/ABOUT/CONTACT 在首页内平滑滚动；在 /works 或详情页时先回首页再定位
  5. 首页顺序 Hero→about→news→预览→footer；contact 定位准确
  6. showreel 在 /works 正常打开
