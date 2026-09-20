import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MediaPicker } from "../components/admin/media-picker";
import {
  ADMIN_NAV_ITEMS,
  getActiveAdminItem,
  isAdminPath,
} from "../lib/admin-navigation";
import {
  createWorkFormState,
  createWorkPayload,
  filterAdminWorks,
  reduceWorkEditorState,
  serializeAdminWork,
} from "../lib/admin-works";
import type { Video } from "../lib/types";

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
  assert.equal(getActiveAdminItem("/dashboard/works/order"), "works");
  assert.equal(getActiveAdminItem("/dashboard/news/example/edit"), "news");
  assert.equal(getActiveAdminItem("/dashboard/settings"), "settings");
  assert.equal(getActiveAdminItem("/dashboard/media"), "media");
  assert.equal(getActiveAdminItem("/login"), null);
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
