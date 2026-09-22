# Dashboard Frontend Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the completed administrator workflows into one balanced-density Linear/Vercel-style CMS and add independently replaceable Hero poster media without changing unrelated public-site behavior.

**Architecture:** Build a small set of focused administrator presentation primitives, then migrate each existing module onto them without changing its data/state ownership. Add one additive nullable Prisma field for the Hero poster, expose an effective poster URL through the existing cached Hero read path, and protect that media in the existing reference index. Each task keeps its current authorization, optimistic rollback, dirty-state, and cache invalidation behavior intact.

**Tech Stack:** Next.js 16.2 App Router, React 19, TypeScript, Tailwind CSS 4, Base UI 1.5, Prisma 7/PostgreSQL, Vercel Blob, Node test runner via `tsx`.

**Spec:** `docs/superpowers/specs/2026-09-22-dashboard-frontend-polish-design.md`

## Global Constraints

- Use the approved balanced-density Linear/Vercel visual direction and the existing black, white, and neutral-gray palette.
- Use Chinese for administrator interface labels; never translate or rewrite authored titles, categories, roles, tools, filenames, or content.
- Preserve existing routes, NextAuth/`requireAdmin()` boundaries, Prisma access patterns, Vercel Blob integration, and public content behavior except for the approved dynamic Hero poster.
- Keep Works as the `/dashboard` default; do not add an analytics or welcome dashboard.
- Do not add a desktop breadcrumb bar, command palette, global search, autosave, roles, revision history, media folders, bulk deletion, or a second UI framework.
- Preserve all dirty-navigation, failed-save, optimistic rollback, media-reference, and cache-invalidation safeguards.
- `posterUrl` is the only approved schema change; its migration is additive and must not rewrite existing content.
- Read the relevant installed Next.js 16 docs before framework-level changes: `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/unstable_cache.md`, `cacheTag.md`, and `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`.
- Do not run `npm run build`; it executes `prisma migrate deploy`. Verify with `npx next build --webpack` and never mutate production data during implementation or testing.
- Do not fix unrelated ESLint warnings or public-site polish.

## File Structure

- `components/ui/menu.tsx`: accessible Base UI menu wrapper used by create/type and overflow menus.
- `components/admin/admin-status-badge.tsx`: single status-badge vocabulary and tone mapping.
- `components/admin/admin-toolbar.tsx`: responsive filter/search/action layout.
- `components/admin/admin-editor-header.tsx`: shared sticky editor title, state, and action region.
- `components/admin/admin-form-section.tsx`: continuous form section with heading, help copy, and divider.
- Existing list/editor/settings/media components keep their current state and network responsibilities; only presentation and explicitly approved behavior move.
- `lib/hero.ts`: pure Hero media fallback/normalization contract shared by the public and administrator paths.
- `prisma/migrations/20260923000000_add_hero_poster_url/migration.sql`: additive nullable Hero poster column.

## Review Focus

- An older cached settings client may omit `posterUrl`; the Hero update endpoint must preserve the existing poster instead of clearing it.
- A null, empty, or whitespace-only stored poster must resolve to `/hero-poster.webp`, while a valid managed Blob poster remains exact and protected.
- Long work titles, article titles, filenames, URLs, and status text must truncate or wrap without horizontal page overflow at 320px.
- Sidebar, back, sign-out, and browser-unload navigation must continue to warn only when the active editor/order/settings state is dirty.
- A Hero poster that becomes referenced after a stale Media-library load must be rejected by the server with 409 and restored in the client with fresh references.

---

### Task 1: Shared Admin Visual Primitives and Shell

**Files:**
- Create: `components/ui/menu.tsx`
- Create: `components/admin/admin-status-badge.tsx`
- Create: `components/admin/admin-toolbar.tsx`
- Create: `components/admin/admin-editor-header.tsx`
- Create: `components/admin/admin-form-section.tsx`
- Modify: `components/admin/admin-shell.tsx`
- Modify: `components/admin/admin-page-header.tsx`
- Modify: `lib/admin-navigation.ts`
- Test: `tests/admin-ui.test.ts`
- Test: `tests/admin-works.test.ts`

**Interfaces:**
- Produces: `ADMIN_NAV_GROUPS: readonly { label: string; items: readonly AdminNavItem[] }[]` while preserving `ADMIN_NAV_ITEMS` for existing consumers.
- Produces: `AdminStatusBadge({ tone, children })`, where `tone` is `"neutral" | "featured" | "published" | "draft" | "success" | "danger"`.
- Produces: `AdminToolbar({ filters, search, actions? })`.
- Produces: `AdminEditorHeader({ title, status, backAction, children })`.
- Produces: `AdminFormSection({ title, description, children })`.
- Produces: Base UI wrappers `Menu`, `MenuTrigger`, `MenuContent`, `MenuItem`, `MenuLinkItem`, and `MenuSeparator`.

- [ ] **Step 1: Write failing navigation and primitive tests**

Add `tests/admin-ui.test.ts` with static-render assertions:

```tsx
import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AdminStatusBadge } from "../components/admin/admin-status-badge";
import { ADMIN_NAV_GROUPS } from "../lib/admin-navigation";

test("admin navigation groups content, page media, and library by responsibility", () => {
  assert.deepEqual(
    ADMIN_NAV_GROUPS.map((group) => [group.label, group.items.map((item) => item.label)]),
    [["内容", ["作品", "News"]], ["网站", ["页面媒体"]], ["资源", ["媒体库"]]],
  );
});

test("ordinary and featured states share the same badge structure", () => {
  const ordinary = renderToStaticMarkup(createElement(AdminStatusBadge, { tone: "neutral" }, "普通"));
  const featured = renderToStaticMarkup(createElement(AdminStatusBadge, { tone: "featured" }, "精选"));
  assert.match(ordinary, /data-admin-status="neutral"/);
  assert.match(featured, /data-admin-status="featured"/);
  assert.match(ordinary, /rounded-full/);
  assert.match(featured, /rounded-full/);
});
```

Update the existing navigation assertion in `tests/admin-works.test.ts` to expect the settings label `页面媒体` while keeping the IDs and routes unchanged.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npx tsx --test tests/admin-ui.test.ts tests/admin-works.test.ts`

Expected: FAIL because `ADMIN_NAV_GROUPS` and `AdminStatusBadge` do not exist and the current label is `页面设置`.

- [ ] **Step 3: Implement the menu and administrator primitives**

Wrap the installed Base UI Menu instead of adding a dependency. The structure in `components/ui/menu.tsx` must follow the existing `components/ui/select.tsx` pattern:

```tsx
"use client";

import * as React from "react";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { cn } from "@/lib/utils";

const Menu = MenuPrimitive.Root;

function MenuTrigger(props: MenuPrimitive.Trigger.Props) {
  return <MenuPrimitive.Trigger data-slot="menu-trigger" {...props} />;
}

function MenuContent({ className, ...props }: MenuPrimitive.Popup.Props) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner sideOffset={6} align="end" className="z-50">
        <MenuPrimitive.Popup
          data-slot="menu-content"
          className={cn("min-w-40 rounded-lg bg-neutral-900 p-1 text-white shadow-xl ring-1 ring-white/10 outline-none", className)}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}
```

Implement `MenuItem` and `MenuLinkItem` with identical visible spacing and Base UI highlighted/disabled states. Export the six interfaces listed above.

Implement the badge with one structural class and tone-only color differences:

```tsx
const tones = {
  neutral: "border-white/15 bg-white/[0.04] text-neutral-300",
  featured: "border-amber-400/25 bg-amber-400/10 text-amber-200",
  published: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
  draft: "border-amber-200/20 bg-amber-100/[0.06] text-amber-100/75",
  success: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
  danger: "border-red-400/25 bg-red-400/10 text-red-200",
} as const;
```

Use responsive, transparent layout wrappers for `AdminToolbar`, `AdminEditorHeader`, and `AdminFormSection`; do not introduce new card backgrounds. `AdminEditorHeader` must use `top-14 md:top-0` so it clears the mobile shell.

- [ ] **Step 4: Restructure the shell without adding a desktop top bar**

Define the navigation source once:

```ts
export const ADMIN_NAV_GROUPS = [
  { label: "内容", items: [ADMIN_NAV_ITEMS[0], ADMIN_NAV_ITEMS[1]] },
  { label: "网站", items: [ADMIN_NAV_ITEMS[2]] },
  { label: "资源", items: [ADMIN_NAV_ITEMS[3]] },
] as const;
```

Change the settings label to `页面媒体`; keep `/dashboard/settings`. In `AdminShell`, render group labels, small Lucide icons selected by item ID, a quiet neutral active row, and the account controls at the bottom. Keep the existing navigation guard, mobile Dialog, route-change close, focus restoration, View site, and guarded sign-out behavior unchanged.

- [ ] **Step 5: Run focused and full tests**

Run: `npx tsx --test tests/admin-ui.test.ts tests/admin-works.test.ts`

Expected: PASS.

Run: `npm test`

Expected: all tests PASS; no dirty-navigation regression.

- [ ] **Step 6: Review the diff and commit**

Confirm there is no desktop breadcrumb/command bar and no new dependency.

```bash
git add components/ui/menu.tsx components/admin/admin-status-badge.tsx components/admin/admin-toolbar.tsx components/admin/admin-editor-header.tsx components/admin/admin-form-section.tsx components/admin/admin-shell.tsx components/admin/admin-page-header.tsx lib/admin-navigation.ts tests/admin-ui.test.ts tests/admin-works.test.ts
git commit -m "refactor(admin): establish dashboard visual system"
```

---

### Task 2: Works List and Ordering Hierarchy

**Files:**
- Modify: `components/admin/works-list.tsx`
- Modify: `components/admin/work-order-editor.tsx`
- Modify: `tests/admin-works.test.ts`

**Interfaces:**
- Consumes: `AdminStatusBadge`, `AdminToolbar`, and Base UI menu wrappers from Task 1.
- Preserves: `filterAdminWorks`, ordering reducer, drag behavior, keyboard/mobile move actions, delete API, rollback, and navigation guard.

- [ ] **Step 1: Add failing Works presentation contracts**

Add assertions to `tests/admin-works.test.ts` that read `components/admin/works-list.tsx` and verify:

```ts
test("Works uses linked identity, shared badges, and a mobile-safe list", () => {
  const source = readFileSync(new URL("../components/admin/works-list.tsx", import.meta.url), "utf8");
  assert.match(source, /AdminStatusBadge/);
  assert.match(source, /href={`\/dashboard\/works\/\$\{work\.id\}\/edit`}/);
  assert.doesNotMatch(source, /min-w-\[760px\]/);
  assert.match(source, /data-admin-work-row/);
});
```

Extend the ordering contract to verify the editor still exposes up/down buttons and an explicit Save order action.

- [ ] **Step 2: Run the test and verify RED**

Run: `npx tsx --test tests/admin-works.test.ts`

Expected: FAIL because the list is still a horizontally scrolling table without the shared badge or row marker.

- [ ] **Step 3: Replace the Works table with responsive semantic rows**

Use a semantic list (`ul`/`li`) with `data-admin-work-row`. The thumbnail and title share the primary edit link; do not make the whole row a button around nested actions. Desktop uses six aligned columns; below `md`, retain thumbnail, title/role, badge, and overflow action while placing lower-priority metadata beneath the title.

Render status as:

```tsx
<AdminStatusBadge tone={work.featured ? "featured" : "neutral"}>
  {work.featured ? "精选" : "普通"}
</AdminStatusBadge>
```

Move delete into the accessible `Menu`; keep public Preview visible and labeled. Preserve the exact confirmation and state rollback.

- [ ] **Step 4: Restyle ordering mode with the same row grammar**

Keep order editing isolated to `/dashboard/works/order`. Use the shared status badge for Featured, retain the numeric position, drag handle, up/down controls, local-only edits, fixed Cancel/Save action bar, retry behavior, and unsaved-navigation guard.

- [ ] **Step 5: Verify Works behavior**

Run: `npx tsx --test tests/admin-works.test.ts`

Expected: PASS.

Run: `npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 6: Review and commit**

Review 320px behavior in responsive dev tools: no page-level horizontal overflow with a long title/category. Do not save or delete production content.

```bash
git add components/admin/works-list.tsx components/admin/work-order-editor.tsx tests/admin-works.test.ts
git commit -m "refactor(admin): clarify Works management hierarchy"
```

---

### Task 3: Continuous Work Editor

**Files:**
- Modify: `components/admin/work-editor.tsx`
- Modify: `components/admin/work-card-preview.tsx`
- Modify: `tests/admin-works.test.ts`

**Interfaces:**
- Consumes: `AdminEditorHeader` and `AdminFormSection` from Task 1.
- Preserves: `WorkFormState`, reducer, full payload including the existing order value, upload selection, save/save-and-return, public preview, dirty guard, and live card preview.

- [ ] **Step 1: Add failing editor hierarchy tests**

Extend `tests/admin-works.test.ts`:

```ts
test("Work editor has one action header and no editable order control", () => {
  const source = readFileSync(new URL("../components/admin/work-editor.tsx", import.meta.url), "utf8");
  assert.match(source, /AdminEditorHeader/);
  assert.match(source, /AdminFormSection/);
  assert.doesNotMatch(source, /id="work-order"/);
  assert.equal((source.match(/保存并返回/g) ?? []).length, 1);
});
```

Keep the existing test that proves the form payload preserves `order`; hiding the control must not reset stored ordering when another field is saved.

- [ ] **Step 2: Run the test and verify RED**

Run: `npx tsx --test tests/admin-works.test.ts`

Expected: FAIL because the current editor renders the order field and two save regions.

- [ ] **Step 3: Implement the continuous form layout**

Replace the custom sticky header with `AdminEditorHeader`. It must show Back, title (`新建作品` before creation), the existing status text, View public page, Save and return, and one primary Save action.

Replace `EditorSection` cards with `AdminFormSection` in this order:

```tsx
<AdminFormSection title="基本信息" description="作品名称、类型、日期与精选状态。">
  <Field label="标题" htmlFor="work-title"><Input id="work-title" /></Field>
  <Field label="分类" htmlFor="work-category"><Input id="work-category" /></Field>
  <Field label="日期" htmlFor="work-date"><Input id="work-date" type="date" /></Field>
  <div><Label htmlFor="work-featured">精选作品</Label><Switch id="work-featured" /></div>
</AdminFormSection>
<AdminFormSection title="媒体" description="公开页面使用的视频与封面。">
  <MediaPicker kind="video" label="从媒体库选择视频" />
  <MediaPicker kind="image" label="从媒体库选择缩略图" />
</AdminFormSection>
<AdminFormSection title="卡片信息" description="用于 Works 页面和快速浏览。">
  <Field label="卡片摘要" htmlFor="work-summary"><textarea id="work-summary" /></Field>
  <Field label="职责" htmlFor="work-role"><Input id="work-role" /></Field>
  <Field label="工具" htmlFor="work-tools"><Input id="work-tools" /></Field>
</AdminFormSection>
<AdminFormSection title="Case Study" description="作品详情页的 Markdown 内容。">
  <MarkdownEditor textareaProps={{ id: "work-description", rows: 12 }} />
</AdminFormSection>
```

Place date and Featured in Basic information. Remove only the visible order input; leave `state.form.order`, reducer behavior, and `createWorkPayload` untouched. Remove the bottom action row entirely.

Keep the preview sticky on wide screens and a native, clearly labeled `<details open>` section below the form on narrow screens. Long content must truncate inside the card rather than widen the page.

- [ ] **Step 4: Verify state and navigation behavior**

Run: `npx tsx --test tests/admin-works.test.ts`

Expected: PASS, including dirty navigation, save failure preservation, in-flight field lock, and order payload preservation.

Run: `npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 5: Review and commit**

Confirm there is exactly one `WorkCardPreview` and one Save-and-return control.

```bash
git add components/admin/work-editor.tsx components/admin/work-card-preview.tsx tests/admin-works.test.ts
git commit -m "refactor(admin): streamline Work editing"
```

---

### Task 4: News List and Publication-Aware Editors

**Files:**
- Modify: `lib/admin-news.ts`
- Modify: `components/admin/news-list.tsx`
- Modify: `components/admin/short-post-editor.tsx`
- Modify: `components/admin/article-editor.tsx`
- Verify: `app/(admin)/dashboard/news/new/page.tsx`
- Modify: `tests/admin-news.test.ts`

**Interfaces:**
- Consumes: Task 1 toolbar, badge, menu, editor header, and form section primitives.
- Produces: `getPostEditorActions(published: boolean): { secondary: { label: string; published: false }; primary: { label: string; published: true } }`.
- Preserves: exact title-nullability type semantics, editor payloads, optimistic publish/delete rollback, draft preview restriction, dirty guard, and Markdown sanitization.

- [ ] **Step 1: Add failing publication-action and layout tests**

Add to `tests/admin-news.test.ts`:

```ts
test("News editor actions reflect current publication state", () => {
  assert.deepEqual(getPostEditorActions(false), {
    secondary: { label: "保存草稿", published: false },
    primary: { label: "发布", published: true },
  });
  assert.deepEqual(getPostEditorActions(true), {
    secondary: { label: "转为草稿", published: false },
    primary: { label: "保存更改", published: true },
  });
});

test("News list uses direct type destinations and shared row status", () => {
  const source = readFileSync(new URL("../components/admin/news-list.tsx", import.meta.url), "utf8");
  assert.match(source, /AdminStatusBadge/);
  assert.match(source, /\/dashboard\/news\/new\?type=short/);
  assert.match(source, /\/dashboard\/news\/new\?type=article/);
  assert.doesNotMatch(source, /min-w-\[880px\]/);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx tsx --test tests/admin-news.test.ts`

Expected: FAIL because `getPostEditorActions` and shared status rows do not exist.

- [ ] **Step 3: Implement the list hierarchy**

Use the Base UI Menu for `新建内容`, with direct Link items to the existing query routes; the route must render the chosen editor immediately and must not introduce a separate chooser screen. Convert the wide table into mobile-safe semantic rows. The title/body identity is the primary edit link, published preview remains visible, and publish/delete move into the overflow menu. Use shared type/state badges.

- [ ] **Step 4: Implement publication-aware editor headers**

Add the pure `getPostEditorActions` helper and use it in both editors based on `state.intendedPublished` (which is initialized from the existing post). Wire secondary to `save(false)` and primary to `save(true)`. Use `AdminEditorHeader` and continuous `AdminFormSection` structure. Preserve exact validation focus, Markdown preview, announcements, and beforeunload behavior.

Ensure `/dashboard/news/new` still validates `type` and renders Short for `short`, Article for `article`, with the existing safe default for unsupported values.

- [ ] **Step 5: Verify News behavior**

Run: `npx tsx --test tests/admin-news.test.ts`

Expected: PASS, including null-title semantics, rollback, draft preview restriction, and dirty navigation.

Run: `npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 6: Review and commit**

```bash
git add lib/admin-news.ts components/admin/news-list.tsx components/admin/short-post-editor.tsx components/admin/article-editor.tsx tests/admin-news.test.ts
git commit -m "refactor(admin): unify News management flow"
```

---

### Task 5: Hero Poster Data Contract and Public Fallback

**Files:**
- Create: `lib/hero.ts`
- Create: `prisma/migrations/20260923000000_add_hero_poster_url/migration.sql`
- Modify: `prisma/schema.prisma`
- Modify: `lib/schemas.ts`
- Modify: `lib/data.ts`
- Modify: `app/api/hero/route.ts`
- Modify: `app/page.tsx`
- Modify: `components/home-client.tsx`
- Modify: `components/hero-video.tsx`
- Test: `tests/admin-settings.test.ts`
- Test: `tests/portfolio-navigation.test.ts`

**Interfaces:**
- Produces: `DEFAULT_HERO_POSTER_URL = "/hero-poster.webp"`.
- Produces: `resolveHeroMedia(hero): { blobUrl: string; posterUrl: string } | null`.
- Produces: `createHeroPosterUpdate(posterUrl: string | null | undefined): {} | { posterUrl: string | null }`.
- Extends: `HeroVideo` with nullable `posterUrl`.
- Extends: Hero PUT body with optional `posterUrl: string | null`; omission preserves the stored value for cached older clients.
- Changes: public `HeroVideo` props to `{ videoUrl: string | null; posterUrl?: string | null }` with the same default fallback.

- [ ] **Step 1: Read installed Next.js 16 caching and Route Handler docs**

Read in full:

```text
node_modules/next/dist/docs/01-app/03-api-reference/04-functions/unstable_cache.md
node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cacheTag.md
node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md
```

Confirm the existing `unstable_cache`, `revalidateTag("hero", { expire: 0 })`, and `revalidatePath("/api/hero")` APIs remain valid in the installed version before editing.

- [ ] **Step 2: Write failing Hero media tests**

Add pure tests to `tests/admin-settings.test.ts`:

```ts
test("Hero media falls back to the bundled poster", () => {
  assert.deepEqual(resolveHeroMedia({ blobUrl: "https://example.com/hero.mp4", posterUrl: null }), {
    blobUrl: "https://example.com/hero.mp4",
    posterUrl: "/hero-poster.webp",
  });
  assert.equal(resolveHeroMedia({ blobUrl: "hero.mp4", posterUrl: "   " })?.posterUrl, "/hero-poster.webp");
  assert.equal(resolveHeroMedia(null), null);
});

test("Hero mutation accepts poster updates without requiring cached old clients to send one", () => {
  assert.equal(heroMutateSchema.safeParse({ blobUrl: "https://example.com/hero.mp4" }).success, true);
  assert.equal(heroMutateSchema.safeParse({ blobUrl: "https://example.com/hero.mp4", posterUrl: "https://example.com/poster.webp" }).success, true);
  assert.deepEqual(createHeroPosterUpdate(undefined), {});
  assert.deepEqual(createHeroPosterUpdate("   "), { posterUrl: null });
});
```

Update `tests/portfolio-navigation.test.ts` to render a custom poster and assert the inline background references it; also assert null/blank poster uses `/hero-poster.webp`.

- [ ] **Step 3: Run the tests and verify RED**

Run: `npx tsx --test tests/admin-settings.test.ts tests/portfolio-navigation.test.ts`

Expected: FAIL because `lib/hero.ts`, `posterUrl`, and the prop do not exist.

- [ ] **Step 4: Add the additive schema and migration**

Update Prisma:

```prisma
model HeroVideo {
  id        String   @id @default("singleton")
  blobUrl   String
  posterUrl String?
  updatedAt DateTime @updatedAt
}
```

Migration content:

```sql
ALTER TABLE "HeroVideo" ADD COLUMN "posterUrl" TEXT;
```

Run `npx prisma generate`. Do not run `prisma migrate deploy`, `prisma migrate dev`, or any command that connects to production.

- [ ] **Step 5: Implement fallback and backward-compatible updates**

Implement the pure resolver:

```ts
export const DEFAULT_HERO_POSTER_URL = "/hero-poster.webp";

export function resolveHeroMedia(hero: { blobUrl: string; posterUrl?: string | null } | null) {
  if (!hero) return null;
  return {
    blobUrl: hero.blobUrl,
    posterUrl: hero.posterUrl?.trim() || DEFAULT_HERO_POSTER_URL,
  };
}

export function createHeroPosterUpdate(posterUrl: string | null | undefined) {
  return posterUrl === undefined ? {} : { posterUrl: posterUrl?.trim() || null };
}
```

Extend `heroMutateSchema` with `posterUrl: z.string().max(2000).nullable().optional()`. In PUT, use the helper so `undefined` does not clear an existing poster:

```ts
const posterUpdate = createHeroPosterUpdate(parsed.data.posterUrl);
```

Create uses `posterUrl: parsed.data.posterUrl?.trim() || null`. Keep authorization and the existing tag/path invalidation.

Use `resolveHeroMedia(await getHero())` in both GET and the home page. Pass the effective poster through `HomeClient` into `HeroVideo`. Replace only the hardcoded `backgroundImage` URL; preserve all current Hero animation, playback, and reduced-motion behavior.

- [ ] **Step 6: Verify contract and build-time types**

Run: `npx tsx --test tests/admin-settings.test.ts tests/portfolio-navigation.test.ts`

Expected: PASS.

Run: `npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 7: Review and commit**

Confirm the migration is a single nullable column and that an omitted poster never writes null.

```bash
git add lib/hero.ts prisma/schema.prisma prisma/migrations/20260923000000_add_hero_poster_url/migration.sql lib/schemas.ts lib/data.ts app/api/hero/route.ts app/page.tsx components/home-client.tsx components/hero-video.tsx tests/admin-settings.test.ts tests/portfolio-navigation.test.ts
git commit -m "feat: make Hero poster configurable"
```

---

### Task 6: Page Media Interface and Atomic Hero Draft

**Files:**
- Modify: `app/(admin)/dashboard/settings/page.tsx`
- Modify: `components/admin/page-settings.tsx`
- Modify: `lib/admin-settings.ts`
- Modify: `tests/admin-settings.test.ts`

**Interfaces:**
- Consumes: Hero `{ blobUrl, posterUrl }` contract from Task 5 and shared form/status primitives from Task 1.
- Produces: `HeroSettingsValue = { videoUrl: string; posterUrl: string }` managed by one `SaveableSettingState`.
- Preserves: Showreel URL/upload behavior and explicit-save semantics.

- [ ] **Step 1: Add failing atomic Hero-settings tests**

Add to `tests/admin-settings.test.ts`:

```ts
test("failed Hero save retains both video and poster drafts", () => {
  const initial = createSaveableSettingState({ videoUrl: "old.mp4", posterUrl: "old.webp" });
  const changed = reduceSaveableSettingState(initial, {
    type: "change",
    value: { videoUrl: "new.mp4", posterUrl: "new.webp" },
  });
  const failed = reduceSaveableSettingState(reduceSaveableSettingState(changed, { type: "save-start" }), {
    type: "save-error",
    message: "network",
  });
  assert.deepEqual(failed.draft, { videoUrl: "new.mp4", posterUrl: "new.webp" });
  assert.deepEqual(failed.saved, { videoUrl: "old.mp4", posterUrl: "old.webp" });
});

test("Page Media exposes separate Hero video and poster pickers", () => {
  const source = readFileSync(new URL("../components/admin/page-settings.tsx", import.meta.url), "utf8");
  assert.match(source, /kind="video"/);
  assert.match(source, /kind="image"/);
  assert.match(source, /替换封面/);
  assert.match(source, /页面媒体/);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx tsx --test tests/admin-settings.test.ts`

Expected: FAIL because Page settings accepts one Hero URL and has no poster picker.

- [ ] **Step 3: Implement the Page Media layout**

Load both Hero fields in the Server Component, applying `DEFAULT_HERO_POSTER_URL` when the row/field is absent. Change PageSettings props to:

```ts
type HeroSettingsValue = { videoUrl: string; posterUrl: string };
type PageSettingsProps = {
  initialHero: HeroSettingsValue;
  initialShowreel: ShowreelValue;
};
```

Use one Hero reducer. `change({ videoUrl })` and `change({ posterUrl })` must preserve the other draft field. Submit both fields in one authenticated PUT:

```ts
body: JSON.stringify({
  blobUrl: state.draft.videoUrl,
  posterUrl: state.draft.posterUrl,
})
```

Render separate current previews and Media pickers (`video/mp4` and image). The shared Hero action saves both. Failed saves retain both drafts; successful saves adopt both. Rename visible page copy to `页面媒体`, while keeping the route.

Showreel uses the same focused media-row layout but retains its existing source type, preview, validation, and save request.

- [ ] **Step 4: Register settings dirty navigation**

Use `useAdminNavigationGuard` and `beforeunload` when either Hero or Showreel reducer is dirty. The confirmation must cover sidebar, View site, sign-out, and browser close, and must not appear after a successful save.

- [ ] **Step 5: Verify settings behavior**

Run: `npx tsx --test tests/admin-settings.test.ts tests/admin-works.test.ts`

Expected: PASS, including sign-out navigation guard contracts.

Run: `npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 6: Review and commit**

```bash
git add 'app/(admin)/dashboard/settings/page.tsx' components/admin/page-settings.tsx lib/admin-settings.ts tests/admin-settings.test.ts
git commit -m "refactor(admin): unify page media settings"
```

---

### Task 7: Media Library Polish and Hero Poster Protection

**Files:**
- Modify: `lib/admin-media.ts`
- Modify: `lib/admin-media.server.ts`
- Modify: `components/admin/media-library.tsx`
- Modify: `tests/admin-media.test.ts`

**Interfaces:**
- Extends: `MediaReference.kind` with `"hero-poster"`.
- Extends: `MediaReferenceSnapshot.hero` to `{ blobUrl: string; posterUrl: string | null }`.
- Consumes: Task 1 toolbar/status/menu primitives.
- Preserves: cursor-safe Blob listing, exact normalized URL matching, optimistic delete rollback, current-request invalidation, 409 reconciliation, and 502 retry behavior.

- [ ] **Step 1: Add failing Hero poster reference tests**

Add to `tests/admin-media.test.ts`:

```ts
test("Hero poster Blob is protected as an exact managed reference", () => {
  const poster = "https://assets.public.blob.vercel-storage.com/hero-poster.webp";
  const references = findMediaReferences(poster, {
    hero: { blobUrl: "https://assets.public.blob.vercel-storage.com/hero.mp4", posterUrl: poster },
    showreel: null,
    videos: [],
    posts: [],
  });
  assert.deepEqual(references, [{
    kind: "hero-poster",
    id: "singleton",
    label: "Hero 视频封面",
    field: "posterUrl",
  }]);
});
```

Update all snapshot fixtures to include `posterUrl: null`. Keep the stale-delete 409 test and change its fresh reference to `hero-poster` in one case, proving server reconciliation protects a poster added after initial load.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx tsx --test tests/admin-media.test.ts`

Expected: FAIL because Hero poster is not in the snapshot or reference union.

- [ ] **Step 3: Extend exact reference detection**

Select `posterUrl` in `loadMediaReferenceSnapshot`. Add the exact normalized comparison:

```ts
if (normalizeManagedBlobUrl(snapshot.hero?.posterUrl) === url) {
  references.push({ kind: "hero-poster", id: "singleton", label: "Hero 视频封面", field: "posterUrl" });
}
```

Do not use filename, prefix, transformed-copy, or substring matching.

- [ ] **Step 4: Apply the approved Media-library layout**

Use the shared page heading and toolbar. Keep storage count/size as compact secondary metadata. Render the responsive visual grid at two columns on typical phones and four columns where space permits. Every card keeps preview, type, filename, size, reference labels, and delete state. Long filenames use `truncate` with the full name available to assistive technology/title.

Referenced media never exposes Delete. Unused deletion keeps the exact filename/size confirmation. Loading, empty, filtering empty, retry, restored-on-failure, and success announcements remain explicit.

- [ ] **Step 5: Verify media safety**

Run: `npx tsx --test tests/admin-media.test.ts`

Expected: PASS, including poster reference, concurrent 409, 502 rollback, request invalidation, and retry.

Run: `npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 6: Review and commit**

```bash
git add lib/admin-media.ts lib/admin-media.server.ts components/admin/media-library.tsx tests/admin-media.test.ts
git commit -m "refactor(admin): polish and protect Media library"
```

---

### Task 8: Cross-Module Responsive, Accessibility, and Final Verification

**Files:**
- Modify: `tests/admin-ui.test.ts`
- Verify: `components/admin/admin-shell.tsx`
- Verify: `components/admin/works-list.tsx`
- Verify: `components/admin/work-editor.tsx`
- Verify: `components/admin/news-list.tsx`
- Verify: `components/admin/short-post-editor.tsx`
- Verify: `components/admin/article-editor.tsx`
- Verify: `components/admin/page-settings.tsx`
- Verify: `components/admin/media-library.tsx`
- Verify: `components/ui/menu.tsx`

**Interfaces:**
- Consumes every prior task; produces no new product API.

- [ ] **Step 1: Add the final cross-module source contracts**

Assert in `tests/admin-ui.test.ts` that:

```ts
test("admin editors retain visible focus and mobile sticky offsets", () => {
  const header = readFileSync(new URL("../components/admin/admin-editor-header.tsx", import.meta.url), "utf8");
  const menu = readFileSync(new URL("../components/ui/menu.tsx", import.meta.url), "utf8");
  assert.match(header, /top-14/);
  assert.match(header, /md:top-0/);
  assert.match(menu, /focus:/);
  assert.match(menu, /outline-none/);
});
```

Add a source contract that the Dashboard shell has no desktop command/search UI and that all list identities use `min-w-0` plus truncation/wrapping classes.

- [ ] **Step 2: Run the complete automated suite**

Run:

```bash
npm test
npx tsc --noEmit
npx eslint .
git diff --check
npx next build --webpack
```

Expected:

- Tests: all PASS.
- TypeScript: PASS.
- ESLint: 0 errors; only pre-existing unrelated warnings may remain.
- Diff check: PASS.
- Production build: PASS without invoking a migration.

If a failure was introduced by this branch, fix only the owning task and repeat the full sequence before browser testing.

- [ ] **Step 3: Start a local production server with non-destructive data access**

Start the built app with the existing local environment and `AUTH_TRUST_HOST=true`. Do not save, publish, upload, reorder, or delete against production-backed services. Log in only to inspect read-only layouts and client-only draft behavior.

- [ ] **Step 4: Verify desktop behavior at 1440px**

Check:

1. Sidebar groups and `页面媒体` label; Works is active on entry.
2. No global breadcrumb/command bar.
3. Works and News rows scan correctly; ordinary and featured badges share structure.
4. Long titles/filenames do not widen the workspace.
5. Work editor has one sticky action header, no visible order field, one preview, and no bottom duplicate actions.
6. News draft/published editors expose the correct action labels.
7. Page Media shows separate Hero video/poster selectors and one shared Hero save action.
8. Media library preserves reference labels, filters, loading, and delete affordance rules.

- [ ] **Step 5: Verify tablet and mobile behavior at 768px and 320px**

Check:

1. Drawer opens, traps focus, closes with Escape, restores trigger focus, and closes after navigation.
2. Lists do not create page-level horizontal scroll.
3. Search/actions wrap without overlap.
4. Sticky editor header clears the mobile top bar.
5. Work preview collapses and reopens.
6. Media grid uses two columns when readable and falls back without clipping.
7. Essential actions remain available without hover.

- [ ] **Step 6: Verify dirty and failure states without production writes**

Change a local field without saving and verify sidebar, Back, View site, and sign-out all use one confirmation. Cancel navigation and confirm the draft remains. Use browser request interception or a local mocked route to force a save failure and verify fields/media selections remain. Do not submit the real production mutation.

- [ ] **Step 7: Review scope and commit only necessary final fixes**

If browser verification required changes, rerun Step 2 and commit them:

```bash
git add components/admin components/ui/menu.tsx tests
git commit -m "fix(admin): complete responsive dashboard polish"
```

If no changes were required, do not create an empty commit.

- [ ] **Step 8: Request whole-branch review**

Review the full branch against `docs/superpowers/specs/2026-09-22-dashboard-frontend-polish-design.md`, with special attention to authorization, dirty-state behavior, Hero cache invalidation, additive migration safety, exact media reference matching, mobile overflow, and unintended public-site changes. Resolve Critical/Important findings, rerun Step 2, and report Minor suggestions without expanding scope.
