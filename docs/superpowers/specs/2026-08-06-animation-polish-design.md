# 动画手感打磨设计

- 日期：2026-08-06
- 范围：对现有四个动画的手感调优，统一视觉反馈类动画的曲线与时长
- 状态：已与用户逐项确认

## 背景

通过浏览器交互对比，用户从 9 个现有动画中选出 4 个需要打磨的，并逐项确定了方向。核心诉求是**已有动效手感打磨**（时长/曲线/节奏），不是新增滚动浮现动画，也不是重构动效体系。

## 确认结果

| 动画 | 决定 |
|------|------|
| Works 展开/收起网格 | 对称 400ms + 展开/收起都加淡入 |
| Hero 视差滚动 | 保持当前，不改动 |
| 页面过渡（缩略图飞入播放器） | 300ms + expo-out 曲线 |
| 视频卡片 hover | 缩放/简介统一 300ms expo-out |

统一采用 `cubic-bezier(0.22, 1, 0.36, 1)`（expo-out），与 navbar 菜单、server-notice 已有的曲线一致。

## 改动明细

### 1. `app/globals.css` — works 展开/收起

- `animate-works-expand`：`420ms` → `400ms`，保留 `translateY(24px) scale(0.985)`，曲线 `cubic-bezier(0.22,1,0.36,1)` 不变
- `animate-works-collapse`：`380ms` → `400ms`，keyframes 从 `translateY(0)` 起始改为 `opacity: 0` + `translateY(-24px)` 起始，与展开对称（展开/收起都带透明度过渡）

### 2. `components/progress-bar.tsx` — 页面过渡飞入

- 克隆图过渡（约 `:64-65`）：`350ms ease` → `300ms cubic-bezier(0.22,1,0.36,1)`
- 飞入后克隆淡出：`350ms` 后的 `setTimeout` → `300ms`
- 兜底分支与清理时序（`~260ms`）保持不变

### 3. `components/video-card.tsx` — 卡片 hover

- 缩略图缩放（`:16`）：`transition-transform duration-300`（默认 ease）→ `300ms cubic-bezier(0.22,1,0.36,1)`
- summary 展开（`:37`）：`300ms ease-in-out` → `300ms cubic-bezier(0.22,1,0.36,1)`

## 不改动

- Hero 视差（保持当前）
- 跑马灯、showreel 弹窗、news 行 hover、navbar 菜单（已统一过）
- 任何新增动画（滚动浮现不在本次范围）

## 验收

- `npm run typecheck`（`npx tsc --noEmit`）通过
- 展开/收起 works 时两者时长一致、均有淡入淡出
- 点击卡片进入详情时克隆图 300ms expo-out 飞向播放器
- 悬停视频卡片时缩放与简介展开手感统一、不突兀
