import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import {
  filterAdminPosts,
  getPostKind,
  normalizeAdminPostTitle,
  reduceNewsListState,
  serializeAdminPost,
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
