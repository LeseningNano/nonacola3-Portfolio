import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { filterMediaPickerFiles } from "../components/admin/media-picker";
import { MediaField } from "../components/admin/media-field";
import { installUnsavedAdminHistoryGuard } from "../lib/admin-history-guard";
import {
  ADMIN_NAV_ITEMS,
  guardAdminAction,
  getActiveAdminItem,
  isAdminPath,
} from "../lib/admin-navigation";
import {
  confirmWorkEditorNavigation,
  createWorkFormState,
  createWorkPayload,
  filterAdminWorks,
  moveWork,
  reduceOrderState,
  reduceWorkEditorState,
  serializeAdminWork,
  validateReorderItems,
  type ReorderItem,
} from "../lib/admin-works";
import { reorderSchema } from "../lib/schemas";
import type { Video } from "../lib/types";

function orderItem(id: string, order: number, featured = false): ReorderItem {
  return { id, order, featured };
}

function adminWork(
  id: string,
  title: string,
  category: string,
  featured: boolean,
): Video {
  return {
    id,
    title,
    description: null,
    summary: null,
    role: null,
    tools: null,
    category,
    embedUrl: "https://example.com",
    thumbnail: null,
    featured,
    order: 0,
    date: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-03T00:00:00.000Z",
  };
}

test("administrator route detection includes dashboard, login, and legacy video editors only", () => {
  assert.equal(isAdminPath("/dashboard"), true);
  assert.equal(isAdminPath("/dashboard/works/example/edit"), true);
  assert.equal(isAdminPath("/videos/new"), true);
  assert.equal(isAdminPath("/videos/example/edit"), true);
  assert.equal(isAdminPath("/works/example"), false);
  assert.equal(isAdminPath("/news/example"), false);
  assert.equal(isAdminPath("/login"), true);
});

test("administrator navigation resolves nested modules", () => {
  assert.deepEqual(ADMIN_NAV_ITEMS.map(({ id }) => id), ["works", "news", "settings", "media"]);
  assert.equal(ADMIN_NAV_ITEMS[2].label, "页面媒体");
  assert.equal(getActiveAdminItem("/dashboard/works/order"), "works");
  assert.equal(getActiveAdminItem("/dashboard/news/example/edit"), "news");
  assert.equal(getActiveAdminItem("/dashboard/settings"), "settings");
  assert.equal(getActiveAdminItem("/dashboard/media"), "media");
  assert.equal(getActiveAdminItem("/login"), null);
});

test("Works uses linked identity, status dots, and a mobile-safe list", () => {
  const source = readFileSync(resolve(process.cwd(), "components/admin/works-list.tsx"), "utf8");
  assert.match(source, /AdminStatus\b/);
  assert.match(source, /href={`\/dashboard\/works\/\$\{work\.id\}\/edit`}/);
  assert.match(source, /data-admin-work-row/);
  assert.match(source, /w-\[7rem\]/);
  assert.match(source, /min-w-0[^"]*"[\s\S]*truncate/);
  assert.match(source, /formatAdminDate\(work\.updatedAt\)/);
  assert.match(source, /没有匹配/);
  assert.doesNotMatch(source, /min-w-\[760px\]/);
});

test("Works ordering retains accessible movement and an explicit save-order action", () => {
  const source = readFileSync(resolve(process.cwd(), "components/admin/work-order-editor.tsx"), "utf8");
  assert.match(source, /aria-label={`上移 \$\{work\?\.title/);
  assert.match(source, /aria-label={`下移 \$\{work\?\.title/);
  assert.match(source, /保存排序/);
  assert.match(source, /padStart\(2, "0"\)/);
  assert.match(source, /bg-admin-accent/);
});

test("sign out is cancelled when the active editor declines navigation", () => {
  let prevented = false;
  let confirmationCalls = 0;

  guardAdminAction(
    { preventDefault: () => { prevented = true; } },
    () => {
      confirmationCalls += 1;
      return false;
    },
  );

  assert.equal(confirmationCalls, 1);
  assert.equal(prevented, true);
});

test("sign out proceeds when navigation is clean or confirmed", () => {
  for (const confirmNavigation of [() => true, undefined]) {
    let prevented = false;
    guardAdminAction({ preventDefault: () => { prevented = true; } }, confirmNavigation);
    assert.equal(prevented, false);
  }
});

test("Work ordering delegates dirty shell navigation to the shared guard", () => {
  const source = readFileSync(resolve(process.cwd(), "components/admin/work-order-editor.tsx"), "utf8");
  assert.match(source, /useAdminNavigationGuard\(confirmNavigation,\s*isDirty\)/);
  assert.doesNotMatch(source, /document\.addEventListener\("click", confirmLinkExit/);
});

test("Work editor has one action header, one media slot per field, and no editable order control", () => {
  const source = readFileSync(resolve(process.cwd(), "components/admin/work-editor.tsx"), "utf8");
  assert.match(source, /AdminEditorHeader/);
  assert.match(source, /AdminFormSection/);
  assert.doesNotMatch(source, /id="work-order"/);
  assert.equal((source.match(/保存并返回/g) ?? []).length, 1);
  assert.equal((source.match(/<WorkCardPreview\b/g) ?? []).length, 1);
  assert.equal((source.match(/<MediaField\b/g) ?? []).length, 2);
  assert.doesNotMatch(source, /id="work-embed-url"/);
  assert.doesNotMatch(source, /id="work-thumbnail"/);
  assert.match(source, /xl:sticky xl:top-24/);
  assert.match(source, /<details open/);
  assert.match(source, /statusText/);
  const header = readFileSync(resolve(process.cwd(), "components/admin/admin-editor-header.tsx"), "utf8");
  assert.match(header, /sticky top-14/);
  assert.match(header, /md:top-0/);
  assert.match(header, /truncate/);
  assert.match(header, /aria-live="polite"/);
  const preview = readFileSync(resolve(process.cwd(), "components/admin/work-card-preview.tsx"), "utf8");
  assert.match(preview, /setViewport\("mobile"\)/);
  assert.match(preview, /setViewport\("desktop"\)/);
  assert.match(preview, /break-words/);
  assert.doesNotMatch(preview, /overflow-x-auto/);
  for (const route of ["app/(admin)/dashboard/works/[id]/edit/page.tsx", "app/(admin)/dashboard/works/new/page.tsx", "app/(admin)/dashboard/news/[id]/edit/page.tsx"]) {
    assert.doesNotMatch(readFileSync(resolve(process.cwd(), route), "utf8"), /AdminPageHeader/, route);
  }
});

test("admin works serialization emits ISO dates without mutating nullable fields", () => {
  const serialized = serializeAdminWork({
    id: "one",
    title: "Work",
    description: null,
    summary: null,
    role: null,
    tools: null,
    category: "PV",
    embedUrl: "https://example.com",
    thumbnail: null,
    featured: true,
    order: 0,
    date: new Date("2026-01-02T00:00:00.000Z"),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-03T00:00:00.000Z"),
  });

  assert.equal(serialized.date, "2026-01-02T00:00:00.000Z");
  assert.equal(serialized.updatedAt, "2026-01-03T00:00:00.000Z");
  assert.equal(serialized.summary, null);
});

test("admin work filtering searches title and category and can limit featured works", () => {
  const works = [
    adminWork("a", "Numb Numb", "PV", true),
    adminWork("b", "BLEAP", "Motion", false),
  ];

  assert.deepEqual(filterAdminWorks(works, "numb", false).map(({ id }) => id), ["a"]);
  assert.deepEqual(filterAdminWorks(works, "motion", false).map(({ id }) => id), ["b"]);
  assert.deepEqual(filterAdminWorks(works, "", true).map(({ id }) => id), ["a"]);
});

test("work payload preserves explicit clears while omitting nothing from the controlled form", () => {
  const state = createWorkFormState(adminWork("a", "Work", "PV", false));
  const payload = createWorkPayload({ ...state, summary: "", role: "", date: "" });

  assert.equal(payload.summary, null);
  assert.equal(payload.role, null);
  assert.equal(payload.date, null);
  assert.equal(payload.title, "Work");
  assert.deepEqual(Object.keys(payload).sort(), [
    "category",
    "date",
    "description",
    "embedUrl",
    "featured",
    "order",
    "role",
    "summary",
    "thumbnail",
    "title",
    "tools",
  ]);
});

test("upload success followed by save failure retains fields and uploaded URL", () => {
  const initial = {
    form: createWorkFormState(),
    baseline: createWorkFormState(),
    status: "clean" as const,
    error: null,
  };
  const typed = reduceWorkEditorState(initial, {
    type: "field",
    field: "title",
    value: "New work",
  });
  const uploaded = reduceWorkEditorState(typed, {
    type: "field",
    field: "thumbnail",
    value: "https://store.public.blob.vercel-storage.com/thumb.webp",
  });
  const failed = reduceWorkEditorState(uploaded, {
    type: "save-error",
    message: "保存失败",
  });

  assert.equal(failed.form.title, "New work");
  assert.match(failed.form.thumbnail, /thumb\.webp$/);
  assert.equal(failed.status, "error");
});

test("edit baseline is clean, a field change is dirty, and save success adopts the saved form", () => {
  const baseline = createWorkFormState(adminWork("a", "Work", "PV", false));
  const initial = { form: baseline, baseline, status: "clean" as const, error: null };
  assert.equal(initial.status, "clean");

  const dirty = reduceWorkEditorState(initial, {
    type: "field",
    field: "title",
    value: "Updated work",
  });
  assert.equal(dirty.status, "dirty");

  const savedForm = { ...dirty.form, title: "Updated work from server" };
  const saved = reduceWorkEditorState(dirty, { type: "save-success", form: savedForm });
  assert.equal(saved.status, "saved");
  assert.deepEqual(saved.form, savedForm);
  assert.deepEqual(saved.baseline, savedForm);
});

test("work editor navigation allows clean state without asking for confirmation", () => {
  let confirmationCalls = 0;

  const allowed = confirmWorkEditorNavigation(false, () => {
    confirmationCalls += 1;
    return false;
  });

  assert.equal(allowed, true);
  assert.equal(confirmationCalls, 0);
});

test("work editor navigation blocks a declined unsaved-changes confirmation", () => {
  const allowed = confirmWorkEditorNavigation(true, () => false);

  assert.equal(allowed, false);
});

test("work editor navigation allows a confirmed unsaved-changes confirmation", () => {
  const allowed = confirmWorkEditorNavigation(true, () => true);

  assert.equal(allowed, true);
});

test("field changes are rejected while a save is in flight", () => {
  const form = { ...createWorkFormState(), title: "Submitted title" };
  const saving = {
    form,
    baseline: createWorkFormState(),
    status: "saving" as const,
    error: null,
  };

  const attemptedEdit = reduceWorkEditorState(saving, {
    type: "field",
    field: "title",
    value: "Late edit",
  });

  assert.equal(attemptedEdit.form.title, "Submitted title");
  assert.equal(attemptedEdit.status, "saving");
});

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
  const state = {
    initial: [orderItem("a", 0), orderItem("b", 1)],
    items: [orderItem("b", 0), orderItem("a", 1)],
    status: "saving" as const,
    error: null,
  };
  const failed = reduceOrderState(state, { type: "save-error", message: "保存失败" });

  assert.deepEqual(failed.items.map(({ id }) => id), ["b", "a"]);
  assert.equal(failed.status, "error");
});

test("reorder schema requires featured and rejects non-contiguous batches", () => {
  assert.equal(reorderSchema.safeParse({ items: [{ id: "a", order: 0 }] }).success, false);
  assert.equal(reorderSchema.safeParse({ items: [orderItem("a", 0), orderItem("b", 2)] }).success, false);
  assert.equal(reorderSchema.safeParse({ items: [orderItem("a", 0), orderItem("b", 1)] }).success, true);
});

test("dirty ordering guard restores the editor entry when Back navigation is cancelled", () => {
  const listeners = new Set<() => void>();
  const calls = { confirm: 0, back: 0, forward: 0 };
  const history = {
    state: { page: "editor" } as Record<string, unknown>,
    replaceState(state: unknown) {
      this.state = state as Record<string, unknown>;
    },
    pushState(state: unknown) {
      this.state = state as Record<string, unknown>;
    },
    back() {
      calls.back += 1;
    },
    forward() {
      calls.forward += 1;
    },
  };
  const target = {
    addEventListener(_type: "popstate", listener: () => void) {
      listeners.add(listener);
    },
    removeEventListener(_type: "popstate", listener: () => void) {
      listeners.delete(listener);
    },
  };

  const cleanup = installUnsavedAdminHistoryGuard({
    history,
    target,
    href: "https://example.com/dashboard/works/order",
    currentHref: () => "https://example.com/dashboard/works/order",
    confirmLeave: () => {
      calls.confirm += 1;
      return false;
    },
  });
  const guardEntry = history.state;
  history.state = { ...guardEntry, __adminHistoryGuardPosition: "base" };
  listeners.forEach((listener) => listener());

  assert.equal(calls.confirm, 1);
  assert.equal(calls.forward, 1);
  assert.equal(calls.back, 0);
  cleanup.remove();
});

test("dirty browser Back proceeds only after one confirmation", () => {
  const listeners = new Set<() => void>();
  const calls = { confirm: 0, back: 0, forward: 0 };
  const history = {
    state: { page: "editor" } as Record<string, unknown>,
    replaceState(state: unknown) { this.state = state as Record<string, unknown>; },
    pushState(state: unknown) { this.state = state as Record<string, unknown>; },
    back() { calls.back += 1; },
    forward() { calls.forward += 1; },
  };
  const target = {
    addEventListener(_type: "popstate", listener: () => void) { listeners.add(listener); },
    removeEventListener(_type: "popstate", listener: () => void) { listeners.delete(listener); },
  };

  const cleanup = installUnsavedAdminHistoryGuard({
    history,
    target,
    href: "https://example.com/dashboard/works/example/edit",
    currentHref: () => "https://example.com/dashboard/works/example/edit",
    confirmLeave: () => { calls.confirm += 1; return true; },
  });
  history.state = { ...history.state, __adminHistoryGuardPosition: "base" };
  listeners.forEach((listener) => listener());

  assert.deepEqual(calls, { confirm: 1, back: 1, forward: 0 });
  cleanup.remove();
});

test("successful save waits for the dirty editor history entry to clear before navigating", () => {
  const listeners = new Set<() => void>();
  const calls = { back: 0, navigations: 0, confirmations: 0 };
  let baseState: unknown;
  const history = {
    state: { page: "editor" } as Record<string, unknown>,
    replaceState(state: unknown) {
      this.state = state as Record<string, unknown>;
      baseState = state;
    },
    pushState(state: unknown) { this.state = state as Record<string, unknown>; },
    back() { calls.back += 1; },
    forward() {},
  };
  const target = {
    addEventListener(_type: "popstate", listener: () => void) { listeners.add(listener); },
    removeEventListener(_type: "popstate", listener: () => void) { listeners.delete(listener); },
  };
  const href = "https://example.com/dashboard/works/example/edit";
  const guard = installUnsavedAdminHistoryGuard({
    history,
    target,
    href,
    currentHref: () => href,
    confirmLeave: () => { calls.confirmations += 1; return false; },
  });

  guard.navigateAfterRelease(() => { calls.navigations += 1; });
  assert.deepEqual(calls, { back: 1, navigations: 0, confirmations: 0 });

  history.state = baseState as Record<string, unknown>;
  listeners.forEach((listener) => listener());
  assert.deepEqual(calls, { back: 1, navigations: 1, confirmations: 0 });

  guard.remove();
  assert.equal(calls.back, 1);
});

test("Next.js route history state does not make editor cleanup undo client navigation", () => {
  const listeners = new Set<() => void>();
  const calls = { back: 0 };
  let currentHref = "https://example.com/dashboard/works/example/edit";
  const history = {
    state: { page: "editor" } as Record<string, unknown>,
    replaceState(state: unknown) { this.state = state as Record<string, unknown>; },
    pushState(state: unknown) { this.state = state as Record<string, unknown>; },
    back() { calls.back += 1; },
    forward() {},
  };
  const target = {
    addEventListener(_type: "popstate", listener: () => void) { listeners.add(listener); },
    removeEventListener(_type: "popstate", listener: () => void) { listeners.delete(listener); },
  };

  const cleanup = installUnsavedAdminHistoryGuard({
    history,
    target,
    href: currentHref,
    currentHref: () => currentHref,
    confirmLeave: () => true,
  });
  history.pushState({ ...history.state, __NA: true, route: "/dashboard/works" });
  currentHref = "https://example.com/dashboard/works";
  cleanup.remove();

  assert.equal(calls.back, 0);
});

test("media field triggers identify which field they change", () => {
  const markup = renderToStaticMarkup(
    createElement("div", null,
      createElement(MediaField, { id: "work-video", label: "作品视频", kind: "video", value: "", onChange: () => {} }),
      createElement(MediaField, { id: "work-thumbnail-field", label: "缩略图", kind: "image", value: "https://x.public.blob.vercel-storage.com/a.webp", onChange: () => {}, optional: true }),
    ),
  );

  assert.match(markup, /<button(?=[^>]+aria-label="从媒体库选择（作品视频）")[^>]*>从媒体库选择<\/button>/);
  assert.match(markup, /<button(?=[^>]+aria-label="编辑地址（作品视频）")[^>]*>编辑地址<\/button>/);
  assert.match(markup, /<button(?=[^>]+aria-label="更换（缩略图）")[^>]*>更换<\/button>/);
  assert.match(markup, /<button(?=[^>]+aria-label="清除（缩略图）")[^>]*>清除<\/button>/);
});

test("media picker excludes non-MP4 library videos when the caller accepts only MP4", () => {
  const files = [
    { url: "https://example.com/hero.mp4", pathname: "uploads/hero.mp4", size: 1, sizeMB: "0.01", references: [] },
    { url: "https://example.com/showreel.webm", pathname: "uploads/showreel.webm", size: 1, sizeMB: "0.01", references: [] },
  ];

  assert.deepEqual(
    filterMediaPickerFiles(files, "video", "video/mp4").map(({ pathname }) => pathname),
    ["uploads/hero.mp4"],
  );
});
