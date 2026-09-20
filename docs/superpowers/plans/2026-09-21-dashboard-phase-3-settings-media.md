# Dashboard Phase 3: Page Settings and Media Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate Hero and Showreel media workflows around the shared Media picker and add a protected Media library that can safely delete only unreferenced Vercel Blob files.

**Architecture:** Pure media-reference helpers normalize managed Blob URLs, extract exact URLs from supported Markdown fields, and build a reference index from one database snapshot. Protected Route Handlers list Blob inventory with references and re-check fresh references immediately before deletion. Page settings reuse the Phase 1 Media picker; the Media library owns inventory, filtering, upload, reference display, confirmation, deletion, and rollback UI.

**Tech Stack:** Next.js 16.2.9 App Router, React 19, TypeScript, Prisma 7, NextAuth 5 beta, Tailwind CSS 4, Vercel Blob SDK, Node test runner through `tsx`.

**Spec:** `docs/superpowers/specs/2026-09-21-dashboard-redesign-design.md`

## Global Constraints

- Phases 1 and 2 must be complete, reviewed, and verified before Phase 3 begins.
- Before editing framework code, read `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` and `15-route-handlers.md` completely.
- Follow the repository `AGENTS.md` model-routing policy. Do not use GPT-6 Astra without explicit user authorization.
- Do not modify public-site visuals, database schema, production data, Works/News behavior, EdgeOne settings, caching policy, or storage provider.
- Media deletion supports only HTTPS Vercel Blob URLs whose hostname ends with `.public.blob.vercel-storage.com` and contains no username/password.
- Reference detection covers `HeroVideo.blobUrl`, uploaded `Showreel.showreelUrl`, `Video.thumbnail`, exact Blob URLs in `Video.description`, and exact Blob URLs in `Post.body`.
- Do not claim detection of copied assets, rewritten URLs, external files, or database fields outside that explicit list.
- Keep `requireAdmin()` on Blob listing, upload, settings mutation, reference lookup, and deletion.
- Deletion must re-read references on the server immediately before calling Vercel Blob `del()`.
- No folders, custom media tags, bulk deletion, or migration.
- Do not run `npm run build`; use `npx next build --webpack` to avoid `prisma migrate deploy`.
- Do not push, deploy, delete production media, or test destructive behavior against production.

## Review Focus

- A malicious or non-Vercel URL must be rejected before database reads or `del()`; Task 1 tests URL validation.
- An exact Blob URL embedded in Markdown or HTML must block deletion, while a different URL sharing only a filename prefix must not; Task 1 tests extraction and matching.
- A stale “unused” UI state must not permit deletion after a new reference is created; Task 2 requires and source-tests a fresh server reference check immediately before `del()`.
- Blob pagination must return every file and terminate when `hasMore` is false; Task 2 tests multi-page listing with an injected list function.
- A listing or deletion failure must preserve the visible Media library item and expose retry instead of presenting an empty successful state; Task 3 tests the client reducer.

---

## File Map

- Create `lib/admin-media.ts`: client-safe managed URL validation/normalization, URL extraction, reference snapshots/indexes, injected pagination helper, Media library reducer.
- Create `lib/admin-media.server.ts`: server-only Prisma snapshot loading and the Vercel Blob SDK wrapper.
- Create `lib/admin-settings.ts`: pure save-state reducer shared by Hero and Showreel settings cards.
- Create `app/api/media/route.ts`: protected deletion endpoint.
- Modify `app/api/blob-usage/route.ts`: paginated inventory plus references, truthful failure responses.
- Create `components/admin/page-settings.tsx`: Hero and Showreel setting cards.
- Create `components/admin/media-library.tsx`: inventory, filters, upload, references, safe deletion.
- Modify `components/admin/media-picker.tsx`: consume enriched listing and expose retry without adding deletion to the picker.
- Create `app/(admin)/dashboard/settings/page.tsx`.
- Create `app/(admin)/dashboard/media/page.tsx`.
- Delete old `hero-upload.tsx`, `showreel-settings.tsx`, and `blob-usage.tsx` only after proving they are unreferenced.
- Create `tests/admin-media.test.ts`.
- Create `tests/admin-settings.test.ts`.

### Task 1: Managed Blob URL and exact-reference model

**Files:**
- Create: `lib/admin-media.ts`
- Create: `tests/admin-media.test.ts`

**Interfaces:**
- Produces `type MediaReference = { kind: "hero" | "showreel" | "work-thumbnail" | "work-body" | "post-body"; id: string; label: string; field: string }`.
- Produces `type MediaReferenceSnapshot` containing Hero URL, Showreel URL/type, Work IDs/titles/thumbnails/descriptions, and Post IDs/titles/bodies.
- Produces `normalizeManagedBlobUrl(value: unknown): string | null`.
- Produces `extractHttpUrls(text: string | null): string[]`.
- Produces `findMediaReferences(url: string, snapshot: MediaReferenceSnapshot): MediaReference[]`.
- Produces `buildMediaReferenceIndex(urls: string[], snapshot: MediaReferenceSnapshot): Record<string, MediaReference[]>`.

- [ ] **Step 1: Write failing URL validation and reference tests**

```ts
import {
  buildMediaReferenceIndex,
  extractHttpUrls,
  findMediaReferences,
  normalizeManagedBlobUrl,
} from "../lib/admin-media";

const blob = "https://store.public.blob.vercel-storage.com/uploads/hero.mp4";

test("managed Blob validation accepts only credential-free HTTPS Vercel Blob hosts", () => {
  assert.equal(normalizeManagedBlobUrl(blob), blob);
  assert.equal(normalizeManagedBlobUrl("http://store.public.blob.vercel-storage.com/file"), null);
  assert.equal(normalizeManagedBlobUrl("https://public.blob.vercel-storage.com.evil.test/file"), null);
  assert.equal(normalizeManagedBlobUrl("https://user:pass@store.public.blob.vercel-storage.com/file"), null);
  assert.equal(normalizeManagedBlobUrl("not a url"), null);
});

test("URL extraction recognizes Markdown and HTML media URLs without prefix matching", () => {
  const other = `${blob}-old`;
  const urls = extractHttpUrls(`![hero](${blob})\n<video src="${other}"></video>`);
  assert.deepEqual(urls, [blob, other]);
});

test("reference lookup covers approved fields and ignores filename-prefix collisions", () => {
  const snapshot = mediaSnapshot({
    heroUrl: blob,
    workDescription: `![used](${blob})`,
    postBody: `<video src="${blob}-old"></video>`,
  });
  assert.deepEqual(findMediaReferences(blob, snapshot).map(({ kind }) => kind), ["hero", "work-body"]);
  assert.deepEqual(findMediaReferences(`${blob}-old`, snapshot).map(({ kind }) => kind), ["post-body"]);
});

test("reference index keeps an explicit empty list for unused files", () => {
  const unused = "https://store.public.blob.vercel-storage.com/uploads/unused.webp";
  const index = buildMediaReferenceIndex([blob, unused], mediaSnapshot({ heroUrl: blob }));
  assert.equal(index[blob].length, 1);
  assert.deepEqual(index[unused], []);
});
```

Define a complete `mediaSnapshot` test factory using only the approved fields.

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `npx tsx --test tests/admin-media.test.ts`

Expected: FAIL because `lib/admin-media.ts` does not exist.

- [ ] **Step 3: Implement managed URL normalization**

Parse with `new URL`, require `https:`, reject credentials, and require a hostname ending exactly in `.public.blob.vercel-storage.com`. Return `url.href` after clearing only the hash. Preserve pathname and search so transformed/query URLs are not silently treated as the same stored object.

- [ ] **Step 4: Implement extraction and exact references**

`extractHttpUrls` must recognize URLs in Markdown links/images and HTML `src`/`href` attributes by extracting full `http://` or `https://` tokens, removing only enclosing quote/bracket punctuation, and returning normalized URL strings. Do not compare partial pathnames or filenames.

`findMediaReferences` compares exact normalized strings and emits stable IDs:

- Hero: `{ kind: "hero", id: "singleton", label: "Hero 背景视频", field: "blobUrl" }`.
- Showreel: only when `videoType === "upload"`.
- Work thumbnail: Work ID/title and `thumbnail`.
- Work body: URLs extracted from `description`.
- Post body: URLs extracted from `body`.

- [ ] **Step 5: Run focused tests, TypeScript, and lint**

Run: `npx tsx --test tests/admin-media.test.ts`

Run: `npx tsc --noEmit`

Run: `npx eslint lib/admin-media.ts tests/admin-media.test.ts`

Expected: all PASS.

- [ ] **Step 6: Review and commit Task 1**

Verify no database or Blob SDK imports exist in the pure helper module.

```powershell
git add -- lib/admin-media.ts tests/admin-media.test.ts
git commit -m "feat: add media reference model"
```

### Task 2: Protected inventory and safe deletion APIs

**Files:**
- Create: `lib/admin-media.server.ts`
- Modify: `app/api/blob-usage/route.ts`
- Create: `app/api/media/route.ts`
- Modify: `lib/schemas.ts`
- Modify: `tests/admin-media.test.ts`

**Interfaces:**
- `lib/admin-media.server.ts` produces `loadMediaReferenceSnapshot(): Promise<MediaReferenceSnapshot>` and is marked `server-only`.
- `lib/admin-media.ts` produces `collectAllManagedBlobs(listFn): Promise<ListBlobResultBlob[]>`; the SDK function is always injected, so this module has no runtime `@vercel/blob` import.
- `lib/admin-media.server.ts` produces `listAllManagedBlobs(): Promise<ListBlobResultBlob[]>` by calling `collectAllManagedBlobs` with the real Vercel Blob `list` function.
- Produces `mediaDeleteSchema = z.object({ url: z.string().url() })`.
- `GET /api/blob-usage` returns `{ count, totalSize, totalSizeMB, files: MediaFile[] }` where `MediaFile` adds `references: MediaReference[]`.
- `DELETE /api/media` accepts `{ url }`, returns 409 `{ error, references }` when referenced, and `{ success: true }` after deletion.

- [ ] **Step 1: Add failing pagination and deletion-contract tests**

```ts
import { collectAllManagedBlobs } from "../lib/admin-media";
import { readFileSync } from "node:fs";

test("Blob listing follows cursors until hasMore is false", async () => {
  const calls: Array<string | undefined> = [];
  const pages = [
    { blobs: [{ url: blob, pathname: "uploads/hero.mp4", size: 10, uploadedAt: new Date("2026-01-01") }], cursor: "next", hasMore: true },
    { blobs: [{ url: `${blob}-2`, pathname: "uploads/other.mp4", size: 20, uploadedAt: new Date("2026-01-02") }], cursor: undefined, hasMore: false },
  ];
  const result = await collectAllManagedBlobs(async ({ cursor } = {}) => {
    calls.push(cursor);
    return pages[calls.length - 1];
  });
  assert.deepEqual(calls, [undefined, "next"]);
  assert.equal(result.length, 2);
});

test("media deletion route authorizes and rechecks references before Blob deletion", () => {
  const source = readFileSync(new URL("../app/api/media/route.ts", import.meta.url), "utf8");
  assert.ok(source.indexOf("requireAdmin") < source.indexOf("normalizeManagedBlobUrl"));
  assert.ok(source.indexOf("loadMediaReferenceSnapshot") < source.indexOf("del("));
  assert.ok(source.indexOf("findMediaReferences") < source.indexOf("del("));
  assert.match(source, /status[^\n]*409|fail\([^\n]*409/);
});
```

Use a structurally valid Blob result factory matching the installed `@vercel/blob` types; do not cast the entire fake to `any`.

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `npx tsx --test tests/admin-media.test.ts`

Expected: FAIL because paginated listing and deletion route do not exist.

- [ ] **Step 3: Implement the server-only snapshot loader**

Load all required fields in one `Promise.all`:

```ts
const [hero, showreel, videos, posts] = await Promise.all([
  db.heroVideo.findUnique({ where: { id: "singleton" }, select: { blobUrl: true } }),
  db.showreel.findUnique({ where: { id: "singleton" }, select: { showreelUrl: true, videoType: true } }),
  db.video.findMany({ select: { id: true, title: true, thumbnail: true, description: true } }),
  db.post.findMany({ select: { id: true, title: true, body: true } }),
]);
```

Implement this loader only in `lib/admin-media.server.ts`, import `server-only` first, and keep all Prisma and `@vercel/blob` imports out of `lib/admin-media.ts`.

- [ ] **Step 4: Implement paginated inventory**

In `collectAllManagedBlobs`, call the injected function with `{ cursor, limit: 1000 }` until `hasMore` is false. Track seen cursors and throw on a repeated cursor to prevent an infinite loop. In `lib/admin-media.server.ts`, make `listAllManagedBlobs()` pass the real SDK `list` function to this helper. `GET /api/blob-usage` must authorize first, call the server wrapper, build one reference snapshot, index all returned URLs, and return enriched files. On SDK/database failure return a 500 JSON error; do not disguise failure as an empty successful library.

- [ ] **Step 5: Implement safe deletion**

The deletion route order is mandatory:

1. `requireAdmin()`.
2. Parse JSON with `mediaDeleteSchema`.
3. Validate with `normalizeManagedBlobUrl`; return 422 when rejected.
4. Load a fresh database snapshot.
5. Call `findMediaReferences` for the exact URL.
6. If references exist, return status 409 with the reference array.
7. Call `del(normalizedUrl)`.
8. Return `success()`.

Catch Blob SDK failures and return a stable 502 error without claiming deletion.

- [ ] **Step 6: Run focused tests, TypeScript, and lint**

Run: `npx tsx --test tests/admin-media.test.ts`

Run: `npx tsc --noEmit`

Run: `npx eslint lib/admin-media.ts lib/admin-media.server.ts lib/schemas.ts app/api/blob-usage/route.ts app/api/media/route.ts tests/admin-media.test.ts`

Expected: all PASS.

- [ ] **Step 7: Review and commit Task 2**

Verify authorization precedes input-dependent data work, the route performs a fresh reference read, and list failures are visible.

```powershell
git add -- lib/admin-media.ts lib/admin-media.server.ts lib/schemas.ts app/api/blob-usage/route.ts app/api/media/route.ts tests/admin-media.test.ts
git commit -m "feat: add protected media inventory API"
```

### Task 3: Media library UI with failure-preserving deletion

**Files:**
- Modify: `lib/admin-media.ts`
- Create: `components/admin/media-library.tsx`
- Create: `app/(admin)/dashboard/media/page.tsx`
- Modify: `components/admin/media-picker.tsx`
- Modify: `tests/admin-media.test.ts`

**Interfaces:**
- Produces `type MediaFile = { url: string; pathname: string; size: number; sizeMB: string; references: MediaReference[] }`.
- Produces `filterMediaFiles(files, filter: "all" | "image" | "video" | "unused", query: string): MediaFile[]`.
- Produces `reduceMediaLibraryState(state, event): MediaLibraryState` with delete snapshots and rollback.
- Produces `MediaLibrary()`.
- Consumes enriched `/api/blob-usage` and `DELETE /api/media`.

- [ ] **Step 1: Add failing filter and rollback tests**

```ts
import { filterMediaFiles, reduceMediaLibraryState } from "../lib/admin-media";

test("Media library filters by kind, unused state, and filename", () => {
  const files = [mediaFile("hero.mp4", [reference("hero")]), mediaFile("unused.webp", [])];
  assert.deepEqual(filterMediaFiles(files, "video", "").map(({ pathname }) => pathname), ["hero.mp4"]);
  assert.deepEqual(filterMediaFiles(files, "unused", "").map(({ pathname }) => pathname), ["unused.webp"]);
  assert.deepEqual(filterMediaFiles(files, "all", "UNUSED").map(({ pathname }) => pathname), ["unused.webp"]);
});

test("failed Media deletion restores the exact visible item", () => {
  const files = [mediaFile("unused.webp", [])];
  const pending = reduceMediaLibraryState({ files, snapshot: null, deletingUrl: null, error: null }, { type: "delete-start", url: files[0].url });
  assert.equal(pending.files.length, 0);
  const restored = reduceMediaLibraryState(pending, { type: "delete-error", message: "删除失败" });
  assert.deepEqual(restored.files, files);
  assert.equal(restored.error, "删除失败");
});
```

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `npx tsx --test tests/admin-media.test.ts`

Expected: FAIL because UI helpers do not exist.

- [ ] **Step 3: Implement filtering and reducer**

Classify image/video by pathname extension using explicit extension sets. `unused` means `references.length === 0`. Search is case-insensitive over pathname. The reducer snapshots before optimistic removal and restores on any non-2xx deletion response.

- [ ] **Step 4: Implement the Media library page**

The Client Component fetches inventory on mount and supports retry. Render:

- `AdminPageHeader` with count, total size, and upload action.
- All/Images/Videos/Unused filters and labelled filename search.
- Responsive cards with preview, pathname, size, and references.
- Referenced files with visible reference labels and no enabled delete action.
- Unused files with a delete action.
- Confirmation containing exact pathname and size.
- Loading, empty, error, deleting, success, and rollback states.

Upload through the existing Media picker/upload path, then refresh inventory. Do not append a guessed client-side file record before the server listing confirms it.

- [ ] **Step 5: Update the shared Media picker**

Consume the enriched `files` shape without exposing deletion inside selection dialogs. Preserve Phase 1 behavior. Display list errors and an explicit retry button instead of converting errors to an empty state.

- [ ] **Step 6: Run focused tests, TypeScript, and lint**

Run: `npx tsx --test tests/admin-media.test.ts tests/admin-works.test.ts`

Run: `npx tsc --noEmit`

Run: `npx eslint lib/admin-media.ts components/admin/media-library.tsx components/admin/media-picker.tsx app/'(admin)'/dashboard/media/page.tsx tests/admin-media.test.ts`

Expected: all PASS, including Phase 1 Media picker tests/contracts.

- [ ] **Step 7: Review and commit Task 3**

Verify 409 and 502 responses restore the item, referenced files cannot initiate delete, and no bulk-delete UI exists.

```powershell
git add -- lib/admin-media.ts components/admin/media-library.tsx components/admin/media-picker.tsx 'app/(admin)/dashboard/media/page.tsx' tests/admin-media.test.ts
git commit -m "feat: add safe media library"
```

### Task 4: Consolidate Hero and Showreel settings

**Files:**
- Create: `lib/admin-settings.ts`
- Create: `components/admin/page-settings.tsx`
- Create: `app/(admin)/dashboard/settings/page.tsx`
- Modify: `components/admin/media-picker.tsx` only if a verified settings requirement is missing.
- Create or modify: `tests/admin-settings.test.ts`

**Interfaces:**
- Produces `type SaveableSettingState<T> = { saved: T; draft: T; status: "clean" | "dirty" | "saving" | "saved" | "error"; error: string | null }`.
- Produces `reduceSaveableSettingState<T>(state, event): SaveableSettingState<T>`; a save error retains `draft` and marks it unsaved.
- Produces `PageSettings({ initialHeroUrl, initialShowreel }: PageSettingsProps)`.
- Produces `HeroSettingsCard` and `ShowreelSettingsCard` as internal or focused exported components.
- Consumes Phase 1 `MediaPicker` and existing `/api/hero` and `/api/showreel` mutation payloads.

- [ ] **Step 1: Add failing settings source/render contracts**

```ts
import { readFileSync } from "node:fs";

test("page settings reuse the shared Media picker for Hero and uploaded Showreel", () => {
  const source = readFileSync(new URL("../components/admin/page-settings.tsx", import.meta.url), "utf8");
  assert.match(source, /MediaPicker/);
  assert.match(source, /kind="video"/);
  assert.match(source, /\/api\/hero/);
  assert.match(source, /\/api\/showreel/);
  assert.doesNotMatch(source, /@vercel\/blob\/client/);
});

test("failed settings save preserves the selected draft value", () => {
  const initial = createSaveableSettingState("saved.mp4");
  const dirty = reduceSaveableSettingState(initial, { type: "change", value: "selected.mp4" });
  const saving = reduceSaveableSettingState(dirty, { type: "save-start" });
  const failed = reduceSaveableSettingState(saving, { type: "save-error", message: "保存失败" });
  assert.equal(failed.saved, "saved.mp4");
  assert.equal(failed.draft, "selected.mp4");
  assert.equal(failed.status, "error");
});
```

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `npx tsx --test tests/admin-settings.test.ts`

Expected: FAIL because `page-settings.tsx` does not exist.

- [ ] **Step 3: Implement the protected settings page**

Load current Hero and Showreel directly on the server, serialize only URLs and `videoType`, then pass them to `PageSettings`. Render two cards with current status, preview, source details, and Change action.

- [ ] **Step 4: Implement Hero and Showreel mutation behavior**

Hero:

- Accept MP4 through `MediaPicker kind="video"`.
- Selection updates local unsaved URL.
- Save calls `PUT /api/hero` with `{ blobUrl }`.

Showreel:

- Retain `url` versus `upload` source choice.
- URL mode uses a labelled URL field and existing embed preview behavior.
- Upload mode uses `MediaPicker kind="video"`.
- Save calls `POST /api/showreel` with `{ showreelUrl, videoType }`.

Both cards distinguish selected/uploaded from saved, preserve local values on failure, expose polite success and assertive failure, and never auto-save after media selection.

- [ ] **Step 5: Run tests, TypeScript, and lint**

Run: `npx tsx --test tests/admin-settings.test.ts tests/admin-media.test.ts tests/admin-works.test.ts`

Run: `npx tsc --noEmit`

Run: `npx eslint lib/admin-settings.ts components/admin/page-settings.tsx components/admin/media-picker.tsx app/'(admin)'/dashboard/settings/page.tsx tests/admin-settings.test.ts`

Expected: all PASS.

- [ ] **Step 6: Review and commit Task 4**

Verify no direct Blob upload implementation remains in settings and selected media is not saved until explicit Save.

```powershell
git add -- lib/admin-settings.ts components/admin/page-settings.tsx components/admin/media-picker.tsx 'app/(admin)/dashboard/settings/page.tsx' tests/admin-settings.test.ts
git commit -m "refactor: consolidate page media settings"
```

### Task 5: Phase 3 cleanup and verification

**Files:**
- Delete only if unreferenced: `components/admin/hero-upload.tsx`, `components/admin/showreel-settings.tsx`, `components/admin/blob-usage.tsx`.
- Modify for verified Phase 3 defects only: Phase 3 files.
- Test: Phase 3 tests plus complete repository tests.

**Interfaces:**
- Consumes all Phase 3 interfaces.
- Produces a deployable Page settings and safe Media library workflow.

- [ ] **Step 1: Prove legacy settings components are unreferenced**

Run:

```powershell
rg -n "HeroUpload|ShowreelSettings|BlobUsage|components/admin/(hero-upload|showreel-settings|blob-usage)" app components tests
```

Delete each file only after confirming no active import remains.

- [ ] **Step 2: Run complete automated verification**

Run: `npm test`

Run: `npx tsc --noEmit`

Run: `npx eslint .`

Run: `npx next build --webpack`

Run: `git diff --check`

Expected: all PASS; no migration or production mutation runs.

- [ ] **Step 3: Perform non-production browser verification**

Use a test Blob store/database or mocked/injected SDK for destructive cases. Verify:

1. Hero and Showreel load current state and use the same Media picker.
2. Upload/selection does not save until explicit Save.
3. Failed settings save preserves selected values.
4. Media inventory pagination, type filters, search, references, and retry.
5. Referenced Hero, Showreel, Work thumbnail, Work body, and Post body files cannot be deleted.
6. A deliberately unreferenced test Blob can be deleted after exact confirmation.
7. A reference created after the list loaded still blocks deletion through the fresh server check.
8. 409/502 failures restore the visible item.
9. Mobile layout and keyboard/focus behavior.
10. Public Hero, Showreel, Works, and News remain unchanged.

- [ ] **Step 4: Review and commit verified cleanup**

Reject any production media deletion, schema migration, bulk-delete feature, or unrelated public-site change.

```powershell
git add -- components/admin app/'(admin)'/dashboard/settings app/'(admin)'/dashboard/media app/api/blob-usage/route.ts app/api/media/route.ts lib/admin-media.ts lib/admin-media.server.ts lib/admin-settings.ts lib/schemas.ts tests/admin-media.test.ts tests/admin-settings.test.ts
git commit -m "refactor: complete media administration"
```

Do not push. Report all verification evidence, test media created/deleted, and final Git status.
