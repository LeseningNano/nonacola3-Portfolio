# Dashboard Phase 2: News Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the combined News composer/list with a dedicated content list, lightweight short-update editor, and full Markdown article editor inside the approved Admin shell.

**Architecture:** Server pages load serialized Post records and focused Client Components own filters and editing state. Pure News helpers define type inference, filtering, payload construction, dirty comparison, and failure-preserving reducers. Existing Post APIs and database fields remain the write path; no schema change is required.

**Tech Stack:** Next.js 16.2.9 App Router, React 19, TypeScript, Prisma 7, NextAuth 5 beta, Tailwind CSS 4, existing Markdown editor and API routes, Node test runner through `tsx`.

**Spec:** `docs/superpowers/specs/2026-09-21-dashboard-redesign-design.md`

## Global Constraints

- Phase 1 must be complete, reviewed, and verified before Phase 2 begins.
- Before editing framework code, read `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`, `05-server-and-client-components.md`, and `15-route-handlers.md` completely.
- Follow the repository `AGENTS.md` model-routing policy. Do not use GPT-6 Astra without explicit user authorization.
- Do not modify the public News presentation, database schema, production data, Works admin, page settings, media deletion, EdgeOne settings, or caching policy in this phase.
- Preserve existing Post semantics: `title === null` identifies a short update; a non-null title identifies an article; `published` controls draft/published state.
- Do not impose a new short-update character limit. Display a live count only.
- Keep `requireAdmin()` on every Post mutation and administrator list endpoint.
- Do not run `npm run build`; use `npx next build --webpack` to avoid `prisma migrate deploy`.
- Do not push, deploy, or test against production unless separately authorized.

## Review Focus

- A Post with `title: null` and Markdown-like body text must remain a short update; Task 1 tests type inference solely from title nullability.
- Draft actions must send `published: false` explicitly rather than losing false through truthiness; Task 2 tests the exact payload.
- Failed create/update must preserve title, body, tag, kind, and intended publication state; Task 2 tests the editor reducer.
- Failed optimistic publish/unpublish or deletion must restore the exact previous list; Task 1 tests list reducer rollback.
- Article preview must sanitize through the existing `MarkdownBody` pipeline rather than raw HTML injection; Task 3 includes a source contract and browser verification.

---

## File Map

- Create `lib/admin-news.ts`: serialized Post type helpers, kind inference, filters, editor and list reducers, payload construction.
- Create `components/admin/news-list.tsx`: filters, search, preview/edit/state/delete actions.
- Create `components/admin/short-post-editor.tsx`: lightweight short update editor.
- Create `components/admin/article-editor.tsx`: Markdown article editor and live preview.
- Create `app/(admin)/dashboard/news/page.tsx`.
- Create `app/(admin)/dashboard/news/new/page.tsx` in Task 3, after both editor components exist.
- Create `app/(admin)/dashboard/news/[id]/edit/page.tsx` in Task 3, after both editor components exist.
- Modify `components/admin/admin-shell.tsx` only if Phase 1 did not already activate the News link correctly.
- Delete `components/admin/post-manager.tsx` only after proving it is unreferenced.
- Create `tests/admin-news.test.ts`.

### Task 1: News model, list route, filters, and rollback behavior

**Files:**
- Create: `lib/admin-news.ts`
- Create: `components/admin/news-list.tsx`
- Create: `app/(admin)/dashboard/news/page.tsx`
- Create: `tests/admin-news.test.ts`

**Interfaces:**
- Produces `type PostKind = "short" | "article"`.
- Produces `serializeAdminPost(post): PostItem`.
- Produces `getPostKind(post: Pick<PostItem, "title">): PostKind`.
- Produces `filterAdminPosts(posts: PostItem[], filter: "all" | "published" | "draft", query: string): PostItem[]`.
- Produces `reduceNewsListState(state, event): NewsListState` with optimistic toggle/delete and rollback snapshots.
- Produces `NewsList({ initialPosts }: { initialPosts: PostItem[] })`.

- [ ] **Step 1: Write failing model and rollback tests**

```ts
import {
  filterAdminPosts,
  getPostKind,
  reduceNewsListState,
  serializeAdminPost,
} from "../lib/admin-news";

test("News kind depends only on title nullability", () => {
  assert.equal(getPostKind({ title: null }), "short");
  assert.equal(getPostKind({ title: "" }), "article");
  assert.equal(getPostKind({ title: "Article" }), "article");
});

test("News filters preserve newest-first source order and search title or body", () => {
  const posts = [post("a", "Article", "alpha body", true), post("b", null, "beta update", false)];
  assert.deepEqual(filterAdminPosts(posts, "published", "").map(({ id }) => id), ["a"]);
  assert.deepEqual(filterAdminPosts(posts, "draft", "beta").map(({ id }) => id), ["b"]);
  assert.deepEqual(filterAdminPosts(posts, "all", "article").map(({ id }) => id), ["a"]);
});

test("failed optimistic News mutation restores the exact previous list", () => {
  const posts = [post("a", "Article", "body", true), post("b", null, "update", false)];
  const pending = reduceNewsListState({ posts, snapshot: null, pendingId: null }, { type: "remove-start", id: "a" });
  assert.deepEqual(pending.posts.map(({ id }) => id), ["b"]);
  const restored = reduceNewsListState(pending, { type: "mutation-error" });
  assert.deepEqual(restored.posts, posts);
});

test("admin Post serialization converts createdAt to ISO", () => {
  const serialized = serializeAdminPost({ id: "a", title: null, body: "body", tag: null, published: true, createdAt: new Date("2026-01-01T00:00:00.000Z") });
  assert.equal(serialized.createdAt, "2026-01-01T00:00:00.000Z");
});
```

Define the `post` factory with every `PostItem` field.

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `npx tsx --test tests/admin-news.test.ts`

Expected: FAIL because `lib/admin-news.ts` does not exist.

- [ ] **Step 3: Implement pure News helpers**

Search is case-insensitive, trimmed, and checks `title ?? ""` plus body. Filter uses explicit `published === true/false`. The reducer stores the previous array in `snapshot` before optimistic toggle/delete and restores it on `mutation-error`.

- [ ] **Step 4: Implement the News server page and list**

The server page loads Posts ordered by `createdAt desc`, serializes them, and passes them to `NewsList`.

The list renders:

- `AdminPageHeader` with count and “新建内容”.
- A menu linking to `/dashboard/news/new?type=short` and `?type=article`.
- All/published/draft filters and a labelled search field.
- Type, title or excerpt, optional tag, created date, state, Preview, Edit, Publish/Unpublish, and Delete.
- Separate empty states for an empty database and empty filter results.

Use the existing `/api/posts/[id]` endpoint for optimistic state changes and deletion. On failure dispatch `mutation-error` and show the server-provided error or a stable Chinese fallback. Keep destructive deletion behind explicit confirmation.

- [ ] **Step 5: Run tests, TypeScript, and lint**

Run: `npx tsx --test tests/admin-news.test.ts`

Run: `npx tsc --noEmit`

Run: `npx eslint lib/admin-news.ts components/admin/news-list.tsx app/'(admin)'/dashboard/news/page.tsx tests/admin-news.test.ts`

Expected: all PASS.

- [ ] **Step 6: Review and commit Task 1**

Verify no public News component changed, filters preserve server order, and rollback restores every Post field.

```powershell
git add -- lib/admin-news.ts components/admin/news-list.tsx 'app/(admin)/dashboard/news/page.tsx' tests/admin-news.test.ts
git commit -m "feat: add News management list"
```

### Task 2: Shared editor state and lightweight short-update workflow

**Files:**
- Modify: `lib/admin-news.ts`
- Create: `components/admin/short-post-editor.tsx`
- Modify: `tests/admin-news.test.ts`

**Interfaces:**
- Produces `type PostEditorState = { kind: PostKind; title: string; body: string; tag: string; intendedPublished: boolean; baseline: PostEditorFields; status: "clean" | "dirty" | "saving" | "saved" | "error"; error: string | null }`.
- Produces `createPostEditorState(kind: PostKind, post?: PostItem): PostEditorState`.
- Produces `validatePostEditor(state: PostEditorState): { ok: true } | { ok: false; field: "title" | "body"; message: string }`.
- Produces `createPostPayload(state: PostEditorState, published: boolean): { title: string | null; body: string; tag: string | null; published: boolean }`.
- Produces `reducePostEditorState(state, event): PostEditorState`.
- Produces `ShortPostEditor({ initialPost }: { initialPost?: PostItem })`.

- [ ] **Step 1: Add failing payload and preservation tests**

```ts
import {
  createPostEditorState,
  createPostPayload,
  reducePostEditorState,
  validatePostEditor,
} from "../lib/admin-news";

test("short-update draft payload sends null title and explicit published false", () => {
  const state = { ...createPostEditorState("short"), body: "  update text  ", tag: "  daily  " };
  assert.deepEqual(createPostPayload(state, false), {
    title: null,
    body: "update text",
    tag: "daily",
    published: false,
  });
});

test("failed News save retains every field and publication intent", () => {
  let state = createPostEditorState("short");
  state = reducePostEditorState(state, { type: "field", field: "body", value: "unfinished update" });
  state = reducePostEditorState(state, { type: "field", field: "tag", value: "daily" });
  state = reducePostEditorState(state, { type: "save-start", published: false });
  state = reducePostEditorState(state, { type: "save-error", message: "保存失败" });
  assert.equal(state.body, "unfinished update");
  assert.equal(state.tag, "daily");
  assert.equal(state.intendedPublished, false);
  assert.equal(state.status, "error");
});

test("short-update validation rejects a whitespace-only body without mutating state", () => {
  const state = { ...createPostEditorState("short"), body: "   " };
  assert.deepEqual(validatePostEditor(state), {
    ok: false,
    field: "body",
    message: "正文不能为空",
  });
  assert.equal(state.body, "   ");
});
```

Also assert that a successful save replaces the baseline and returns `clean/saved` semantics without clearing content.

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `npx tsx --test tests/admin-news.test.ts`

Expected: FAIL because editor helpers do not exist.

- [ ] **Step 3: Implement pure editor state and payloads**

`validatePostEditor` trims only for validation and never mutates state. It rejects an empty body for both kinds and an empty title for articles, returning the exact discriminated union above. `createPostPayload` is called only after validation succeeds; it always includes `published`, maps empty tag to `null`, maps short title to `null`, and trims title/body/tag. Do not use truthiness to omit false.

- [ ] **Step 4: Implement the short editor component**

`ShortPostEditor` contains a labelled body textarea, optional tag, live character count with no new maximum, Publish, Save draft, and Back. It uses POST for create and PUT for edit. It calls `validatePostEditor` before every request and focuses the invalid field. Save failure preserves state. On create success, replace the URL with `/dashboard/news/${id}/edit`; “Back” with dirty state asks for confirmation.

Do not create the new/edit route pages in this task. Task 3 creates both pages once `ShortPostEditor` and `ArticleEditor` exist, so the route never contains a temporary disabled branch or placeholder editor. Phase 2 is not deployable until Task 4 verification completes.

- [ ] **Step 5: Run tests, TypeScript, and lint**

Run: `npx tsx --test tests/admin-news.test.ts`

Run: `npx tsc --noEmit`

Run: `npx eslint lib/admin-news.ts components/admin/short-post-editor.tsx tests/admin-news.test.ts`

Expected: all PASS.

- [ ] **Step 6: Review and commit Task 2**

Verify draft false is present in the request body, no field is cleared on error, and short updates never render the Markdown article layout.

```powershell
git add -- lib/admin-news.ts components/admin/short-post-editor.tsx tests/admin-news.test.ts
git commit -m "feat: add short News editor"
```

### Task 3: Markdown article editor and safe live preview

**Files:**
- Create: `components/admin/article-editor.tsx`
- Create: `app/(admin)/dashboard/news/new/page.tsx`
- Create: `app/(admin)/dashboard/news/[id]/edit/page.tsx`
- Modify: `tests/admin-news.test.ts`

**Interfaces:**
- Consumes `PostEditorState`, `createPostEditorState`, `createPostPayload`, and reducer from Task 2.
- Produces `ArticleEditor({ initialPost }: { initialPost?: PostItem })`.
- Continues using `MarkdownEditor` and `MarkdownBody`; it does not create another Markdown parser.

- [ ] **Step 1: Add failing article-contract tests**

```ts
import { readFileSync } from "node:fs";

test("article payload requires a trimmed title and preserves explicit draft state", () => {
  const state = { ...createPostEditorState("article"), title: "  Process notes  ", body: "  body  " };
  assert.deepEqual(createPostPayload(state, false), {
    title: "Process notes",
    body: "body",
    tag: null,
    published: false,
  });
});

test("article preview reuses the sanitized Markdown rendering pipeline", () => {
  const source = readFileSync(new URL("../components/admin/article-editor.tsx", import.meta.url), "utf8");
  assert.match(source, /MarkdownEditor/);
  assert.match(source, /MarkdownBody/);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML/);
});
```

Add validation tests proving whitespace-only article title and body each return the exact invalid field and leave editor state unchanged.

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `npx tsx --test tests/admin-news.test.ts`

Expected: FAIL because `ArticleEditor` does not exist or article validation is incomplete.

- [ ] **Step 3: Implement the article editor**

Render:

- Labelled title and tag inputs.
- Two-column Markdown editor and `MarkdownBody` live preview on desktop.
- A tab/stack arrangement on mobile.
- Publish and Save draft actions.
- Dirty/saving/saved/error status and unsaved Back confirmation.

Use the same POST/PUT and success navigation rules as the short editor. Do not duplicate upload code already inside `MarkdownEditor`. Preview `body` through `MarkdownBody content={state.body}` only.

- [ ] **Step 4: Complete route dispatch**

In Next.js 16, await `searchParams`. `/dashboard/news/new` renders `ShortPostEditor` for `type=short`, `ArticleEditor` for `type=article`, and two accessible choice cards linking to those exact query values when the type is missing or invalid.

The edit page loads the Post, calls `notFound()` when absent, serializes it, renders `ShortPostEditor` only when `post.title === null`, and renders `ArticleEditor` otherwise. Do not coerce empty-string titles to short updates. Both paths pass serialized `PostItem` values only.

- [ ] **Step 5: Run focused tests, TypeScript, and lint**

Run: `npx tsx --test tests/admin-news.test.ts`

Run: `npx tsc --noEmit`

Run: `npx eslint components/admin/article-editor.tsx app/'(admin)'/dashboard/news lib/admin-news.ts tests/admin-news.test.ts`

Expected: all PASS.

- [ ] **Step 6: Review and commit Task 3**

Verify raw HTML is never injected outside the existing sanitized Markdown pipeline and both published/draft payloads are explicit.

```powershell
git add -- components/admin/article-editor.tsx 'app/(admin)/dashboard/news/new/page.tsx' 'app/(admin)/dashboard/news/[id]/edit/page.tsx' lib/admin-news.ts tests/admin-news.test.ts
git commit -m "feat: add Markdown News editor"
```

### Task 4: Phase 2 cleanup and verification

**Files:**
- Delete only if unreferenced: `components/admin/post-manager.tsx`
- Modify for verified Phase 2 defects only: Phase 2 files.
- Test: `tests/admin-news.test.ts` and complete repository tests.

**Interfaces:**
- Consumes all Phase 2 interfaces.
- Produces a deployable News management workflow.

- [ ] **Step 1: Prove the old manager is unreferenced**

Run:

```powershell
rg -n "PostManager|components/admin/post-manager" app components tests
```

Delete `post-manager.tsx` only when no active import remains.

- [ ] **Step 2: Run complete automated verification**

Run: `npm test`

Run: `npx tsc --noEmit`

Run: `npx eslint .`

Run: `npx next build --webpack`

Run: `git diff --check`

Expected: all PASS; no Prisma migration runs.

- [ ] **Step 3: Perform local production browser verification**

Using non-production data, verify:

1. News list filters and search.
2. New-content menu and invalid/missing type chooser.
3. Short update create/edit/publish/draft and character feedback.
4. Article create/edit, responsive Markdown preview, publish, and draft.
5. Save failures retain all input and intended state.
6. Publish/unpublish and delete rollback on forced API failure.
7. Dirty navigation confirmation.
8. Keyboard operation, labels, focus, and live status announcements.
9. Public News pages remain unchanged.

- [ ] **Step 4: Review and commit verified cleanup**

```powershell
git add -- components/admin app/'(admin)'/dashboard/news lib/admin-news.ts tests/admin-news.test.ts
git commit -m "refactor: complete News admin workflow"
```

Do not push. Report verification evidence and Git status before Phase 3 begins.
