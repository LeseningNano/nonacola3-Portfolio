# 动画手感打磨 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 打磨 4 个现有动画的手感：works 展开/收起对称化、页面过渡飞入改 expo-out、卡片 hover 统一 expo-out 曲线，Hero 视差保持不动。

**Architecture:** 纯 CSS/TSX 微调，不改数据结构与逻辑。统一视觉反馈类动画用 `cubic-bezier(0.22,1,0.36,1)`（expo-out），时长集中在 300–400ms。无新增依赖、无新增组件。

**Tech Stack:** Next.js 16 (Turbopack)、Tailwind CSS v4、React 19。验证方式为 `npx tsc --noEmit` + `npx next build` + 浏览器人工查看（项目无测试框架）。

**设计文档:** `docs/superpowers/specs/2026-08-06-animation-polish-design.md`

---

### Task 1: works 展开/收起对称化

**Files:**
- Modify: `app/globals.css:286-302`

- [ ] **Step 1: 修改 `animate-works-expand` 时长 420ms → 400ms**

将 `app/globals.css` 第 291-293 行改为：

```css
.animate-works-expand {
  animation: works-expand 400ms cubic-bezier(0.22, 1, 0.36, 1);
}
```

- [ ] **Step 2: 修改 `animate-works-collapse` 时长 380ms → 400ms 并确保有淡入**

当前 `@keyframes works-collapse`（296-299 行）已有 `opacity: 0` 起始帧。将第 300-302 行时长改为：

```css
.animate-works-collapse {
  animation: works-collapse 400ms cubic-bezier(0.22, 1, 0.36, 1);
}
```

> 注意：keyframes `works-collapse`（`from { opacity: 0; transform: translateY(-24px); }`）本身无需改动——淡入已在 spec 落地时（此前一次编辑）加入，此处只改时长使其与展开对称。

- [ ] **Step 3: 类型检查**

Run: `npx tsc --noEmit`
Expected: 无输出（0 error）

- [ ] **Step 4: 构建验证**

Run: `npx next build 2>&1 | Select-String "Compiled|Failed|error" | Select-Object -First 10`
Expected: 包含 `Compiled successfully`，无 `error`

- [ ] **Step 5: 提交**

```bash
git add app/globals.css
git commit -m "tweak(animation): symmetric 400ms expand/collapse for works grid"
```

---

### Task 2: 页面过渡飞入改 expo-out

**Files:**
- Modify: `components/progress-bar.tsx:64-65`、`:72-75`

- [ ] **Step 1: 克隆图过渡 350ms ease → 300ms expo-out**

将 `components/progress-bar.tsx` 第 64-65 行的 transition 字符串改为：

```ts
clone.style.transition =
  "left 300ms cubic-bezier(0.22, 1, 0.36, 1), top 300ms cubic-bezier(0.22, 1, 0.36, 1), width 300ms cubic-bezier(0.22, 1, 0.36, 1), height 300ms cubic-bezier(0.22, 1, 0.36, 1), opacity 250ms ease";
```

- [ ] **Step 2: 同步克隆淡出触发时间 350 → 300**

将 `components/progress-bar.tsx` 第 75 行的 `}, 350);` 改为：

```ts
        }, 300);
```

- [ ] **Step 3: 类型检查**

Run: `npx tsc --noEmit`
Expected: 无输出（0 error）

- [ ] **Step 4: 构建验证**

Run: `npx next build 2>&1 | Select-String "Compiled|Failed|error" | Select-Object -First 10`
Expected: 包含 `Compiled successfully`，无 `error`

- [ ] **Step 5: 提交**

```bash
git add components/progress-bar.tsx
git commit -m "tweak(animation): page transition fly-in 300ms expo-out"
```

---

### Task 3: 视频卡片 hover 统一 expo-out

**Files:**
- Modify: `components/video-card.tsx:16`、`:37`

- [ ] **Step 1: 缩略图缩放 300ms 默认 ease → 300ms expo-out**

将 `components/video-card.tsx` 第 16 行改为：

```tsx
<div className="absolute inset-0 transition-transform duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105">
```

- [ ] **Step 2: summary 展开 300ms ease-in-out → 300ms expo-out**

将 `components/video-card.tsx` 第 37 行改为：

```tsx
<div className="grid transition-[grid-template-rows] duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] grid-rows-[0fr] group-hover:grid-rows-[1fr]">
```

- [ ] **Step 3: 类型检查**

Run: `npx tsc --noEmit`
Expected: 无输出（0 error）

- [ ] **Step 4: 构建验证**

Run: `npx next build 2>&1 | Select-String "Compiled|Failed|error" | Select-Object -First 10`
Expected: 包含 `Compiled successfully`，无 `error`

- [ ] **Step 5: 提交**

```bash
git add components/video-card.tsx
git commit -m "tweak(animation): video card hover unified expo-out curve"
```

---

### Task 4: 端到端人工验收 + 推送

**Files:**
- 无（只读验证 + git push）

- [ ] **Step 1: 本地 dev 启动并逐项核对**

Run: `npm run dev`
在浏览器打开 `http://localhost:3000`，人工核对：
1. works 区点"显示全部作品/收起"——展开与收起都 400ms、都有淡入淡出
2. 点击任一视频卡片进入详情——缩略图克隆 300ms expo-out 飞向播放器
3. 悬停视频卡片——缩略图缩放与简介展开手感统一、顺滑
4. Hero 视差行为与改动前一致（未改动）

- [ ] **Step 2: 确认无遗漏改动**

Run: `git status`
Expected: 仅显示 Task 1-3 提交，无未暂存改动

- [ ] **Step 3: 推送**

```bash
git push
```

Expected: 显示 `master -> master` 成功推送
