import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import {
  createPostEditorState,
  createPostPayload,
  filterAdminPosts,
  getPostKind,
  normalizeAdminPostTitle,
  reducePostEditorState,
  reduceNewsListState,
  serializeAdminPost,
  validatePostEditor,
} from "../lib/admin-news";
import type { PostItem } from "../lib/types";

function post(
  id: string,
  title: string | null,
  body: string,
  published: boolean,
): PostItem {
  return {
    id,
    title,
    body,
    tag: null,
    published,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

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

test("admin post title normalization preserves the empty article-title value", () => {
  assert.equal(normalizeAdminPostTitle(null), null);
  assert.equal(normalizeAdminPostTitle(""), "");
  assert.equal(normalizeAdminPostTitle(" Article "), "Article");
});

test("post endpoints and public News treat only null titles as short updates", () => {
  const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
  const createRoute = source("app/api/posts/route.ts");
  const updateRoute = source("app/api/posts/[id]/route.ts");
  const newsSection = source("components/news-section.tsx");
  const articlePage = source("app/news/[id]/page.tsx");

  assert.match(createRoute, /normalizeAdminPostTitle\(b\.title\)/);
  assert.match(updateRoute, /normalizeAdminPostTitle\(b\.title\)/);
  assert.match(newsSection, /const isArticle = post\.title !== null;/);
  assert.match(articlePage, /post\.title === null/);
});

test("short-update draft payload sends null title and explicit published false", () => {
  const state = {
    ...createPostEditorState("short"),
    body: "  update text  ",
    tag: "  daily  ",
  };

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

  assert.equal(state.kind, "short");
  assert.equal(state.title, "");
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

test("successful News save replaces the baseline without clearing fields", () => {
  let state = createPostEditorState("short");
  state = reducePostEditorState(state, { type: "field", field: "body", value: "saved update" });
  state = reducePostEditorState(state, { type: "field", field: "tag", value: "daily" });
  state = reducePostEditorState(state, { type: "save-start", published: true });
  state = reducePostEditorState(state, { type: "save-success" });

  assert.equal(state.body, "saved update");
  assert.equal(state.tag, "daily");
  assert.equal(state.intendedPublished, true);
  assert.equal(state.status, "saved");
  assert.deepEqual(state.baseline, {
    title: "",
    body: "saved update",
    tag: "daily",
    intendedPublished: true,
  });
});
