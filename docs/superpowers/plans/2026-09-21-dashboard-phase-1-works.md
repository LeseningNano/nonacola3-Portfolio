# Dashboard Phase 1: Admin Shell and Works Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-page administrator Dashboard with a responsive administration shell whose default module is a full-width Works list, integrated Work editor with live card preview, and explicit reorder mode.

**Architecture:** Protected Server Component routes load initial Prisma data and pass serialized values to focused Client Components. A dedicated Admin shell owns navigation and suppresses public navigation on administrator routes. Pure helpers own active-route resolution, Work form serialization, dirty comparison, and reorder state so the critical behavior can be tested without a browser DOM.

**Tech Stack:** Next.js 16.2.9 App Router, React 19, TypeScript, Prisma 7, NextAuth 5 beta, Tailwind CSS 4, Base UI, Vercel Blob client upload, Node test runner through `tsx`.

**Spec:** `docs/superpowers/specs/2026-09-21-dashboard-redesign-design.md`

## Global Constraints

- Before editing framework code, read `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`, `05-server-and-client-components.md`, `15-route-handlers.md`, and `node_modules/next/dist/docs/01-app/02-guides/redirecting.md` completely.
- Follow the repository `AGENTS.md` model-routing policy. Do not use GPT-6 Astra without explicit user authorization.
- Do not modify the public-site visual design, public Works layout, database schema, production data, EdgeOne settings, caching policy, Hero, Showreel, or News in this phase.
- Keep `requireAdmin()` on every mutation, upload, Blob listing, and ordering endpoint.
- Do not expose database or Blob credentials to Client Components.
- Work saves remain immediate; do not add drafts, auto-save, revision history, or publishing state.
- Keep existing `/videos/new` and `/videos/[id]/edit` URLs as server redirects to the new Dashboard routes.
- Use existing dependencies. Native desktop drag events plus up/down buttons are sufficient; do not add a drag-and-drop package.
- Do not run `npm run build`; it includes `prisma migrate deploy`. Use `npx next build --webpack`.
- Do not push, deploy, or test against production unless the user separately authorizes it.

## Review Focus

- A partial Work update containing `null` optional values must preserve explicit clears without removing fields omitted from the request; Task 3 tests both cases.
- Upload success followed by Work-save failure must retain the uploaded URL and all form input; Task 3 tests the editor state reducer.
- An ordering request with duplicate IDs, duplicate order values, or a non-contiguous sequence must be rejected before the transaction; Task 4 tests each invalid shape.
- Failed ordering save must retain the locally arranged list and expose retry/cancel; Task 4 tests the state transition.
- Administrator navigation on `/dashboard/*` and legacy `/videos/*` must not render the public Navbar, while public routes remain unchanged; Task 1 tests route classification.

---

## File Map

- Create `lib/admin-navigation.ts`: administrator path detection, navigation items, active-item resolution.
- Create `lib/admin-works.ts`: serialized Work form types, form conversion, dirty comparison, ordering helpers, ordering validation.
- Create `components/admin/admin-shell.tsx`: desktop sidebar, mobile header/drawer, View site, Sign out.
- Create `components/admin/admin-page-header.tsx`: consistent page title, status, actions.
- Create `components/admin/works-list.tsx`: search/filter/list actions.
- Create `components/admin/work-editor.tsx`: Work form state, save states, unsaved navigation protection.
- Create `components/admin/work-card-preview.tsx`: `/works` card preview driven only by form values.
- Create `components/admin/media-picker.tsx`: reusable upload and Blob selection dialog with caller-provided media kind.
- Create `components/admin/work-order-editor.tsx`: local reorder/featured state and explicit commit.
- Create `app/(admin)/dashboard/actions.ts`: administrator sign-out server action.
- Replace `app/(admin)/dashboard/layout.tsx`: protected Admin shell.
- Replace `app/(admin)/dashboard/page.tsx`: redirect to `/dashboard/works`.
- Create `app/(admin)/dashboard/works/page.tsx`.
- Create `app/(admin)/dashboard/works/new/page.tsx`.
- Create `app/(admin)/dashboard/works/[id]/edit/page.tsx`.
- Create `app/(admin)/dashboard/works/order/page.tsx`.
- Replace legacy `app/(admin)/videos/new/page.tsx` and `app/(admin)/videos/[id]/edit/page.tsx` with redirects.
- Modify `components/navbar.tsx`: suppress public navigation on administrator paths.
- Modify `lib/schemas.ts` and `app/api/videos/reorder/route.ts`: atomic order plus featured updates and strict payload validation.
- Modify `tests/portfolio-navigation.test.ts` and create `tests/admin-works.test.ts`.

### Task 1: Administrator route model and responsive shell

**Files:**
- Create: `lib/admin-navigation.ts`
- Create: `components/admin/admin-shell.tsx`
- Create: `components/admin/admin-page-header.tsx`
- Create: `app/(admin)/dashboard/actions.ts`
- Modify: `app/(admin)/dashboard/layout.tsx`
- Modify: `components/navbar.tsx`
- Modify: `tests/portfolio-navigation.test.ts`
- Create: `tests/admin-works.test.ts`

**Interfaces:**
- Produces `ADMIN_NAV_ITEMS: readonly { href: string; label: string; id: "works" | "news" | "settings" | "media" }[]`.
- Produces `isAdminPath(pathname: string): boolean`.
- Produces `getActiveAdminItem(pathname: string): AdminNavItem["id"] | null`.
- Produces `AdminShell({ children, userName }: { children: ReactNode; userName?: string | null })`.
- Produces `AdminPageHeader({ title, description, status, actions }: AdminPageHeaderProps)`.
- Produces server action `logoutAdmin(): Promise<void>`.

- [ ] **Step 1: Write failing navigation tests**

Add exact route-classification tests:

```ts
import {
  ADMIN_NAV_ITEMS,
  getActiveAdminItem,
  isAdminPath,
} from "../lib/admin-navigation";

test("administrator route detection includes dashboard and legacy video editors only", () => {
  assert.equal(isAdminPath("/dashboard"), true);
  assert.equal(isAdminPath("/dashboard/works/example/edit"), true);
  assert.equal(isAdminPath("/videos/new"), true);
  assert.equal(isAdminPath("/videos/example/edit"), true);
  assert.equal(isAdminPath("/works/example"), false);
  assert.equal(isAdminPath("/news/example"), false);
  assert.equal(isAdminPath("/login"), false);
});

test("administrator navigation resolves nested modules", () => {
  assert.deepEqual(ADMIN_NAV_ITEMS.map(({ id }) => id), ["works", "news", "settings", "media"]);
  assert.equal(getActiveAdminItem("/dashboard/works/order"), "works");
  assert.equal(getActiveAdminItem("/dashboard/news/example/edit"), "news");
  assert.equal(getActiveAdminItem("/dashboard/settings"), "settings");
  assert.equal(getActiveAdminItem("/dashboard/media"), "media");
  assert.equal(getActiveAdminItem("/login"), null);
});
```

- [ ] **Step 2: Run the focused tests and confirm RED**

Run: `npx tsx --test tests/admin-works.test.ts tests/portfolio-navigation.test.ts`

Expected: FAIL because `lib/admin-navigation.ts` does not exist.

- [ ] **Step 3: Implement the pure navigation model**

Use exact prefixes and longest-prefix active matching:

```ts
export const ADMIN_NAV_ITEMS = [
  { id: "works", label: "作品", href: "/dashboard/works" },
  { id: "news", label: "News", href: "/dashboard/news" },
  { id: "settings", label: "页面设置", href: "/dashboard/settings" },
  { id: "media", label: "媒体库", href: "/dashboard/media" },
] as const;

export type AdminNavItem = (typeof ADMIN_NAV_ITEMS)[number];

export function isAdminPath(pathname: string) {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/") ||
    pathname === "/videos/new" || /^\/videos\/[^/]+\/edit$/.test(pathname);
}

export function getActiveAdminItem(pathname: string): AdminNavItem["id"] | null {
  return ADMIN_NAV_ITEMS.find(({ href }) => pathname === href || pathname.startsWith(`${href}/`))?.id ?? null;
}
```

- [ ] **Step 4: Implement the Admin shell and sign-out action**

`DashboardLayout` must call `auth()`, redirect non-admin users to `/login`, and render:

```tsx
<AdminShell userName={session.user.name}>{children}</AdminShell>
```

`AdminShell` must use the pure navigation model, render a 176–208px desktop sidebar, a mobile header and Base UI dialog/drawer-style navigation, `View site` linking to `/`, and a form whose action is `logoutAdmin`. The main element must use `min-w-0 md:pl-[var(--admin-sidebar-width)]` and 16px mobile / 24–32px desktop padding. Do not render dashboard content in a centered maximum-width wrapper.

Implement the server action as:

```ts
"use server";
import { signOut } from "@/lib/auth";

export async function logoutAdmin() {
  await signOut({ redirectTo: "/login" });
}
```

Add `aria-current="page"` to the active navigation link, return focus to the mobile trigger after closing, and close the drawer on route change.

- [ ] **Step 5: Suppress the public Navbar on administrator paths**

Keep every existing hook unconditional. After all hooks and before the JSX return, add:

```ts
if (isAdminPath(pathname)) return null;
```

Import `isAdminPath` from `lib/admin-navigation`. Do not change public Navbar animation or menu behavior.

- [ ] **Step 6: Run tests, TypeScript, and lint**

Run: `npx tsx --test tests/admin-works.test.ts tests/portfolio-navigation.test.ts`

Run: `npx tsc --noEmit`

Run: `npx eslint components/admin/admin-shell.tsx components/admin/admin-page-header.tsx components/navbar.tsx app/'(admin)'/dashboard/layout.tsx app/'(admin)'/dashboard/actions.ts lib/admin-navigation.ts tests/admin-works.test.ts tests/portfolio-navigation.test.ts`

Expected: all PASS.

- [ ] **Step 7: Review and commit Task 1**

Verify public routes retain their Navbar, administrator routes use only the Admin shell, and authentication remains server-side.

```powershell
git add -- lib/admin-navigation.ts components/admin/admin-shell.tsx components/admin/admin-page-header.tsx components/navbar.tsx 'app/(admin)/dashboard/layout.tsx' 'app/(admin)/dashboard/actions.ts' tests/admin-works.test.ts tests/portfolio-navigation.test.ts
git commit -m "feat: add dedicated admin shell"
```

### Task 2: Works list and new route structure

**Files:**
- Create: `lib/admin-works.ts`
- Create: `components/admin/works-list.tsx`
- Replace: `app/(admin)/dashboard/page.tsx`
- Create: `app/(admin)/dashboard/works/page.tsx`
- Create: `app/(admin)/dashboard/works/new/page.tsx`
- Create: `app/(admin)/dashboard/works/[id]/edit/page.tsx`
- Create: `app/(admin)/dashboard/works/order/page.tsx`
- Replace: `app/(admin)/videos/new/page.tsx`
- Replace: `app/(admin)/videos/[id]/edit/page.tsx`
- Modify: `tests/admin-works.test.ts`

**Interfaces:**
- Produces `type AdminWork = Video` from `lib/types.ts`.
- Produces `serializeAdminWork(video: Prisma Video result): Video` with ISO dates.
- Produces `filterAdminWorks(works: Video[], query: string, featuredOnly: boolean): Video[]`.
- Produces `WorksList({ initialWorks }: { initialWorks: Video[] })`.
- Consumes `AdminPageHeader` from Task 1.

- [ ] **Step 1: Add failing serialization and filter tests**

```ts
import { filterAdminWorks, serializeAdminWork } from "../lib/admin-works";

test("admin works serialization emits ISO dates without mutating nullable fields", () => {
  const serialized = serializeAdminWork({
    id: "one", title: "Work", description: null, summary: null, role: null,
    tools: null, category: "PV", embedUrl: "https://example.com", thumbnail: null,
    featured: true, order: 0, date: new Date("2026-01-02T00:00:00.000Z"),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-03T00:00:00.000Z"),
  });
  assert.equal(serialized.date, "2026-01-02T00:00:00.000Z");
  assert.equal(serialized.updatedAt, "2026-01-03T00:00:00.000Z");
  assert.equal(serialized.summary, null);
});

test("admin work filtering searches title and category and can limit featured works", () => {
  const works = [adminWork("a", "Numb Numb", "PV", true), adminWork("b", "BLEAP", "Motion", false)];
  assert.deepEqual(filterAdminWorks(works, "numb", false).map(({ id }) => id), ["a"]);
  assert.deepEqual(filterAdminWorks(works, "motion", false).map(({ id }) => id), ["b"]);
  assert.deepEqual(filterAdminWorks(works, "", true).map(({ id }) => id), ["a"]);
});
```

Define the local `adminWork` test factory with every `Video` field so the test compiles under strict TypeScript.

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `npx tsx --test tests/admin-works.test.ts`

Expected: FAIL because the new exports do not exist.

- [ ] **Step 3: Implement serialization and filtering**

`serializeAdminWork` accepts a structural type whose three date fields are `Date | null` and returns `Video`. Search must be case-insensitive, trim whitespace, and cover title plus category. Preserve database order.

- [ ] **Step 4: Implement the Works list route and component**

The server page loads all videos ordered by `order asc, createdAt desc`, serializes them, and passes them to `WorksList`.

`WorksList` must render:

- `AdminPageHeader` with “作品”, count text, and “新建作品”.
- All/featured filters and a labelled search input.
- Rows containing order, thumbnail, title, category, featured state, updated date, public preview link, and edit link.
- An empty state that distinguishes “no works exist” from “no filter results”.
- A link to `/dashboard/works/order`.

Do not add inline deletion to the primary row. Put destructive deletion behind an overflow action with the existing confirmation and `/api/videos/[id]` endpoint.

- [ ] **Step 5: Add server routes and compatibility redirects**

Implement `/dashboard` with `redirect("/dashboard/works")`.

New/edit/order pages must load their initial data on the server. Missing edit IDs call `notFound()`. Legacy pages use server redirects:

```ts
export default function LegacyNewWorkPage() {
  redirect("/dashboard/works/new");
}
```

The legacy edit route awaits `params` and redirects to `/dashboard/works/${id}/edit`.

- [ ] **Step 6: Run focused tests, TypeScript, and lint**

Run: `npx tsx --test tests/admin-works.test.ts`

Run: `npx tsc --noEmit`

Run: `npx eslint lib/admin-works.ts components/admin/works-list.tsx app/'(admin)'/dashboard app/'(admin)'/videos tests/admin-works.test.ts`

Expected: all PASS.

- [ ] **Step 7: Review and commit Task 2**

Verify all dates crossing the server/client boundary are strings, legacy URLs redirect, and no public route changed.

```powershell
git add -- lib/admin-works.ts components/admin/works-list.tsx 'app/(admin)/dashboard/page.tsx' 'app/(admin)/dashboard/works' 'app/(admin)/videos/new/page.tsx' 'app/(admin)/videos/[id]/edit/page.tsx' tests/admin-works.test.ts
git commit -m "feat: add works management routes"
```

### Task 3: Work editor, media picker, and live card preview

**Files:**
- Create: `components/admin/media-picker.tsx`
- Create: `components/admin/work-card-preview.tsx`
- Create: `components/admin/work-editor.tsx`
- Modify: `lib/admin-works.ts`
- Modify: `app/(admin)/dashboard/works/new/page.tsx`
- Modify: `app/(admin)/dashboard/works/[id]/edit/page.tsx`
- Modify: `tests/admin-works.test.ts`

**Interfaces:**
- Produces `type WorkFormState` with every editable Video field represented as controlled strings/booleans/numbers.
- Produces `type WorkEditorStatus = "clean" | "dirty" | "saving" | "saved" | "error"`.
- Produces `createWorkFormState(work?: Video): WorkFormState`.
- Produces `createWorkPayload(state: WorkFormState): Video create/update payload`.
- Produces `reduceWorkEditorState(state, event): WorkEditorState` for upload/save failure preservation.
- Produces `MediaPicker({ kind, value, onSelect, label }: MediaPickerProps)` where `kind` is `"image" | "video"`.
- Produces `WorkCardPreview({ value }: { value: WorkFormState })`.
- Produces `WorkEditor({ mode, initialWork }: { mode: "create" | "edit"; initialWork?: Video })`.

- [ ] **Step 1: Add failing form and failure-preservation tests**

```ts
import {
  createWorkFormState,
  createWorkPayload,
  reduceWorkEditorState,
} from "../lib/admin-works";

test("work payload preserves explicit clears while omitting nothing from the controlled form", () => {
  const state = createWorkFormState(adminWork("a", "Work", "PV", false));
  const payload = createWorkPayload({ ...state, summary: "", role: "", date: "" });
  assert.equal(payload.summary, null);
  assert.equal(payload.role, null);
  assert.equal(payload.date, null);
  assert.equal(payload.title, "Work");
});

test("upload success followed by save failure retains fields and uploaded URL", () => {
  const initial = { form: createWorkFormState(), baseline: createWorkFormState(), status: "clean" as const, error: null };
  const typed = reduceWorkEditorState(initial, { type: "field", field: "title", value: "New work" });
  const uploaded = reduceWorkEditorState(typed, { type: "field", field: "thumbnail", value: "https://store.public.blob.vercel-storage.com/thumb.webp" });
  const failed = reduceWorkEditorState(uploaded, { type: "save-error", message: "保存失败" });
  assert.equal(failed.form.title, "New work");
  assert.match(failed.form.thumbnail, /thumb\.webp$/);
  assert.equal(failed.status, "error");
});
```

Also test that an edit baseline produces `clean`, changing one field produces `dirty`, and `save-success` replaces the baseline with the saved form.

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `npx tsx --test tests/admin-works.test.ts`

Expected: FAIL because form helpers do not exist.

- [ ] **Step 3: Implement pure form state and reducer**

Define controlled fields explicitly. `createWorkPayload` trims required strings, maps empty nullable strings to `null`, keeps `order` as a non-negative integer, and never uses truthiness to decide whether a field is sent. The reducer must not clear `form` on `save-error` or upload-related field changes.

- [ ] **Step 4: Implement the shared Media picker**

The picker must:

- Fetch `/api/blob-usage` only when opened.
- Filter files by image/video extension according to `kind`.
- Upload through `@vercel/blob/client` and `/api/blob-token`.
- Validate MIME type before upload.
- Report numeric progress.
- Call `onSelect(url)` only after a Blob URL exists.
- Preserve the selected URL if the surrounding Work save fails.
- Use the existing Base UI dialog with labelled title, loading, empty, error, and retry states.

Use `accept="image/jpeg,image/png,image/webp,image/gif"` for images and `accept="video/*"` for video callers. Do not implement deletion in this component during Phase 1.

- [ ] **Step 5: Implement the card preview**

Render the same information hierarchy as the public selected Work card without importing its navigation link:

- 16:9 thumbnail or neutral placeholder.
- Title and category.
- Role and Tools only when non-empty.
- Summary only when non-empty.
- Static “View Case Study →” text.

Use the form value directly and avoid network requests. Provide desktop/mobile preview width controls that only change the preview container width.

- [ ] **Step 6: Implement the Work editor**

Use labelled sections in this order: Basic information, Media, Presentation information, Case Study. Keep `MarkdownEditor` for description.

Save behavior:

```ts
const endpoint = mode === "create" ? "/api/videos" : `/api/videos/${initialWork!.id}`;
const method = mode === "create" ? "POST" : "PUT";
```

On success, replace the baseline with the server response normalized through `createWorkFormState`, announce success, and for new Works replace the route with `/dashboard/works/${saved.id}/edit`. “Save and return” saves first and navigates only after success. “View public page” is disabled until a Work has an ID.

Use `beforeunload` for browser exits and intercept internal Back/Cancel actions with a confirmation when dirty. Do not globally block unrelated navigation APIs.

- [ ] **Step 7: Wire new and edit pages**

New page renders `<WorkEditor mode="create" />`. Edit page loads and serializes the Work, then renders `<WorkEditor mode="edit" initialWork={work} />`.

- [ ] **Step 8: Run tests, TypeScript, and lint**

Run: `npx tsx --test tests/admin-works.test.ts`

Run: `npx tsc --noEmit`

Run: `npx eslint lib/admin-works.ts components/admin/media-picker.tsx components/admin/work-card-preview.tsx components/admin/work-editor.tsx app/'(admin)'/dashboard/works tests/admin-works.test.ts`

Expected: all PASS.

- [ ] **Step 9: Review and commit Task 3**

Verify form values survive every error path, preview performs no fetch, labels are programmatic, and the old `VideoForm` is no longer imported by active routes. Do not delete the old component until the final Phase 1 cleanup confirms no imports remain.

```powershell
git add -- lib/admin-works.ts components/admin/media-picker.tsx components/admin/work-card-preview.tsx components/admin/work-editor.tsx 'app/(admin)/dashboard/works/new/page.tsx' 'app/(admin)/dashboard/works/[id]/edit/page.tsx' tests/admin-works.test.ts
git commit -m "feat: redesign work editor workflow"
```

### Task 4: Explicit ordering mode and atomic validation

**Files:**
- Modify: `lib/admin-works.ts`
- Create: `components/admin/work-order-editor.tsx`
- Modify: `lib/schemas.ts`
- Modify: `app/api/videos/reorder/route.ts`
- Modify: `app/(admin)/dashboard/works/order/page.tsx`
- Modify: `tests/admin-works.test.ts`

**Interfaces:**
- Produces `type ReorderItem = { id: string; order: number; featured: boolean }`.
- Produces `moveWork(items: ReorderItem[], from: number, to: number): ReorderItem[]`.
- Produces `validateReorderItems(items: ReorderItem[]): { ok: true } | { ok: false; error: string }`.
- Produces `reduceOrderState(state, event): WorkOrderState`.
- Produces `WorkOrderEditor({ initialWorks }: { initialWorks: Video[] })`.
- Extends `reorderSchema` items with required `featured: boolean` and cross-item uniqueness/contiguity refinement.

- [ ] **Step 1: Add failing ordering tests**

```ts
import { moveWork, reduceOrderState, validateReorderItems } from "../lib/admin-works";

test("moving a work normalizes every order without mutating the input", () => {
  const input = [orderItem("a", 0), orderItem("b", 1), orderItem("c", 2)];
  const moved = moveWork(input, 0, 2);
  assert.deepEqual(moved.map(({ id, order }) => [id, order]), [["b", 0], ["c", 1], ["a", 2]]);
  assert.deepEqual(input.map(({ id }) => id), ["a", "b", "c"]);
});

test("ordering validation rejects duplicate ids, duplicate orders, and gaps", () => {
  assert.equal(validateReorderItems([orderItem("a", 0), orderItem("a", 1)]).ok, false);
  assert.equal(validateReorderItems([orderItem("a", 0), orderItem("b", 0)]).ok, false);
  assert.equal(validateReorderItems([orderItem("a", 0), orderItem("b", 2)]).ok, false);
  assert.equal(validateReorderItems([orderItem("a", 0), orderItem("b", 1)]).ok, true);
});

test("failed ordering save retains local order and enables retry", () => {
  const state = { initial: [orderItem("a", 0), orderItem("b", 1)], items: [orderItem("b", 0), orderItem("a", 1)], status: "saving" as const, error: null };
  const failed = reduceOrderState(state, { type: "save-error", message: "保存失败" });
  assert.deepEqual(failed.items.map(({ id }) => id), ["b", "a"]);
  assert.equal(failed.status, "error");
});
```

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `npx tsx --test tests/admin-works.test.ts`

Expected: FAIL because ordering helpers do not exist.

- [ ] **Step 3: Implement pure ordering helpers and strict schema**

Normalize orders to `0..n-1`. Schema refinement must reject duplicate IDs, duplicate orders, and any sorted order array that differs from `[0, 1, ..., n-1]`. Limit remains 1000 items.

- [ ] **Step 4: Update the ordering endpoint atomically**

Each Prisma update writes both `order` and `featured` inside the existing transaction:

```ts
data: { order: item.order, featured: item.featured }
```

Keep authorization first, return 422 for invalid payloads, and revalidate only after the transaction succeeds.

- [ ] **Step 5: Implement the ordering UI**

The server page loads and serializes Works. The client editor provides:

- Native desktop drag handles.
- A visible insertion target.
- Up/down buttons with accessible names.
- Featured checkbox.
- Current numeric order.
- Fixed Cancel/Save action bar shown only when dirty.
- Unsaved-exit confirmation.
- Retry after save failure without resetting `items`.

After successful save, replace both `initial` and `items` with the committed values and show a polite success announcement.

- [ ] **Step 6: Run focused and API-adjacent tests**

Run: `npx tsx --test tests/admin-works.test.ts tests/portfolio-navigation.test.ts`

Run: `npx tsc --noEmit`

Run: `npx eslint lib/admin-works.ts lib/schemas.ts components/admin/work-order-editor.tsx app/api/videos/reorder/route.ts app/'(admin)'/dashboard/works/order/page.tsx tests/admin-works.test.ts`

Expected: all PASS.

- [ ] **Step 7: Review and commit Task 4**

Verify invalid requests cannot start a transaction, failed saves retain local state, and public order changes only after explicit save.

```powershell
git add -- lib/admin-works.ts lib/schemas.ts components/admin/work-order-editor.tsx app/api/videos/reorder/route.ts 'app/(admin)/dashboard/works/order/page.tsx' tests/admin-works.test.ts
git commit -m "feat: add explicit work ordering mode"
```

### Task 5: Phase 1 cleanup and verification

**Files:**
- Delete only if unreferenced: `components/admin/video-table.tsx`, `components/admin/video-form.tsx`, `app/(admin)/videos/layout.tsx`, `app/(admin)/videos/loading.tsx`
- Modify only to correct defects demonstrated by Tasks 1–4 verification: files created in Tasks 1–4.
- Test: `tests/admin-works.test.ts`, `tests/portfolio-navigation.test.ts`, existing repository tests.

**Interfaces:**
- Consumes all Phase 1 interfaces.
- Produces a deployable Admin shell and Works workflow; adds no new API.

- [ ] **Step 1: Prove legacy components are unreferenced before deletion**

Run:

```powershell
rg -n "VideoTable|VideoForm|components/admin/video-table|components/admin/video-form" app components tests
```

Delete a legacy component only when the output contains no active imports. Preserve legacy redirect pages. Do not delete any file based only on its old name.

- [ ] **Step 2: Run complete automated verification**

Run: `npm test`

Run: `npx tsc --noEmit`

Run: `npx eslint .`

Run: `npx next build --webpack`

Run: `git diff --check`

Expected: all commands PASS. The build must not execute Prisma migrations.

- [ ] **Step 3: Perform local production browser verification**

Use a non-production database/environment. Verify:

1. Unauthenticated Dashboard access redirects to `/login`.
2. Authenticated `/dashboard` redirects to Works.
3. Public Navbar remains visible on public pages and absent from Dashboard/legacy editor URLs.
4. Desktop sidebar and mobile drawer navigation work by keyboard.
5. Search/filter, create, edit, upload, save, save-and-return, and public preview work.
6. Upload failure and Work-save failure retain the complete form.
7. Dirty navigation confirmation appears only with unsaved changes.
8. Drag, keyboard move, featured toggle, cancel, save, failure, and retry behave as specified.
9. Existing public Works pages render unchanged.

- [ ] **Step 4: Review the Phase 1 diff against the spec**

Reject unrelated public-site changes, database migrations, new dependencies, and visual redesign outside administrator routes.

- [ ] **Step 5: Commit verified cleanup**

```powershell
git add -- components/admin app/'(admin)'/dashboard app/'(admin)'/videos lib/admin-navigation.ts lib/admin-works.ts lib/schemas.ts app/api/videos/reorder/route.ts tests/admin-works.test.ts tests/portfolio-navigation.test.ts
git commit -m "refactor: complete works admin workflow"
```

Do not push. Report each command result, browser verification, retained legacy files, and current Git status before Phase 2 begins.
