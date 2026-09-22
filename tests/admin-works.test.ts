import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { filterMediaPickerFiles, MediaPicker } from "../components/admin/media-picker";
import { installUnsavedOrderHistoryGuard } from "../components/admin/work-order-editor";
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
  assert.equal(ADMIN_NAV_ITEMS[2].label, "页面媒体");
  assert.equal(getActiveAdminItem("/dashboard/works/order"), "works");
  assert.equal(getActiveAdminItem("/dashboard/news/example/edit"), "news");
  assert.equal(getActiveAdminItem("/dashboard/settings"), "settings");
  assert.equal(getActiveAdminItem("/dashboard/media"), "media");
  assert.equal(getActiveAdminItem("/login"), null);
});

test("Works uses linked identity, shared badges, and a mobile-safe list", () => {
  const source = readFileSync(resolve(process.cwd(), "components/admin/works-list.tsx"), "utf8");
  assert.match(source, /AdminStatusBadge/);
  assert.match(source, /href={`\/dashboard\/works\/\$\{work\.id\}\/edit`}/);
  assert.doesNotMatch(source, /min-w-\[760px\]/);
  assert.match(source, /data-admin-work-row/);
});

test("Works ordering retains accessible movement and an explicit save-order action", () => {
  const source = readFileSync(resolve(process.cwd(), "components/admin/work-order-editor.tsx"), "utf8");
  assert.match(source, /aria-label={`上移 \$\{work\?\.title/);
  assert.match(source, /aria-label={`下移 \$\{work\?\.title/);
  assert.match(source, /保存排序/);
  assert.match(source, /AdminStatusBadge/);
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
  assert.match(source, /useAdminNavigationGuard\(confirmNavigation\)/);
  assert.doesNotMatch(source, /document\.addEventListener\("click", confirmLinkExit/);
});

test("Work editor keeps a sticky action header and a collapsible responsive card preview", () => {
  const source = readFileSync(resolve(process.cwd(), "components/admin/work-editor.tsx"), "utf8");
  assert.match(source, /sticky top-14/);
  assert.match(source, /md:top-0/);
  assert.match(source, /xl:top-24/);
  assert.match(source, /<details open/);
  assert.match(source, /statusText/);
  const preview = readFileSync(resolve(process.cwd(), "components/admin/work-card-preview.tsx"), "utf8");
  assert.match(preview, /setViewport\("mobile"\)/);
  assert.match(preview, /setViewport\("desktop"\)/);
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

  const cleanup = installUnsavedOrderHistoryGuard({
    history,
    target,
    href: "https://example.com/dashboard/works/order",
    confirmLeave: () => {
      calls.confirm += 1;
      return false;
    },
  });
  const guardEntry = history.state;
  history.state = { ...guardEntry, __workOrderGuardPosition: "base" };
  listeners.forEach((listener) => listener());

  assert.equal(calls.confirm, 1);
  assert.equal(calls.forward, 1);
  assert.equal(calls.back, 0);
  cleanup();
});

test("media picker labels identify their distinct trigger buttons", () => {
  const markup = renderToStaticMarkup(
    createElement("div", null,
      createElement(MediaPicker, {
        kind: "video",
        value: "",
        onSelect: () => {},
        label: "从媒体库选择视频",
      }),
      createElement(MediaPicker, {
        kind: "image",
        value: "",
        onSelect: () => {},
        label: "从媒体库选择缩略图",
      }),
    ),
  );

  assert.match(markup, /<label(?=[^>]+for="media-picker-[^"]+")[^>]*>从媒体库选择视频<\/label>/);
  assert.match(markup, /<button(?=[^>]+id="media-picker-[^"]+")(?=[^>]+aria-label="从媒体库选择视频")[^>]*>/);
  assert.match(markup, /<label(?=[^>]+for="media-picker-[^"]+")[^>]*>从媒体库选择缩略图<\/label>/);
  assert.match(markup, /<button(?=[^>]+id="media-picker-[^"]+")(?=[^>]+aria-label="从媒体库选择缩略图")[^>]*>/);
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
