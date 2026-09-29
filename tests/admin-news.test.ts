import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NewsList } from "../components/admin/news-list";
import {
  confirmPostEditorNavigation,
  createPostEditorState,
  createPostPayload,
  filterAdminPosts,
  getPostEditorActions,
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

test("News list uses direct type destinations, type icons, and status dots", () => {
  const source = readFileSync(new URL("../components/admin/news-list.tsx", import.meta.url), "utf8");
  assert.match(source, /AdminStatus\b/);
  assert.match(source, /\/dashboard\/news\/new\?type=short/);
  assert.match(source, /\/dashboard\/news\/new\?type=article/);
  assert.match(source, /FileText/);
  assert.match(source, /MessageCircle/);
  assert.match(source, /sr-only">\{kind === "article" \? "文章" : "短动态"\}/);
  assert.doesNotMatch(source, />\{kind === "article" \? "文章" : "短动态"\}<\/AdminStatus/);
  assert.doesNotMatch(source, /min-w-\[880px\]/);
});

test("News editors use shared state-aware headers and continuous form sections", () => {
  const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
  for (const editor of ["components/admin/short-post-editor.tsx", "components/admin/article-editor.tsx"]) {
    const contents = source(editor);
    assert.match(contents, /AdminEditorHeader/);
    assert.match(contents, /AdminFormSection/);
    assert.match(contents, /getPostEditorActions\(state\.intendedPublished\)/);
  }
});

test("draft News entries do not expose a public Preview action", () => {
  const draftMarkup = renderToStaticMarkup(
    createElement(NewsList, { initialPosts: [post("draft", "Unpublished article", "body", false)] }),
  );
  const publishedMarkup = renderToStaticMarkup(
    createElement(NewsList, { initialPosts: [post("published", "Published article", "body", true)] }),
  );

  assert.doesNotMatch(draftMarkup, /aria-label="预览 Unpublished article"/);
  assert.match(publishedMarkup, /aria-label="预览 Published article"/);
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

test("News editor navigation confirms only when content is dirty", () => {
  let confirmationCalls = 0;
  const confirmLeave = () => {
    confirmationCalls += 1;
    return false;
  };

  assert.equal(confirmPostEditorNavigation(false, confirmLeave), true);
  assert.equal(confirmationCalls, 0);
  assert.equal(confirmPostEditorNavigation(true, confirmLeave), false);
  assert.equal(confirmationCalls, 1);
  assert.equal(confirmPostEditorNavigation(true, () => true), true);
});

test("both News editors register their dirty-navigation policy with the Admin shell", () => {
  const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

  for (const path of [
    "components/admin/short-post-editor.tsx",
    "components/admin/article-editor.tsx",
  ]) {
    const editor = source(path);
    assert.match(editor, /useAdminNavigationGuard\(confirmNavigation,\s*isDirty\)/);
  }
});

test("article draft payload trims content and preserves explicit published false", () => {
  const state = {
    ...createPostEditorState("article"),
    title: "  Process notes  ",
    body: "  body  ",
  };

  assert.deepEqual(createPostPayload(state, false), {
    title: "Process notes",
    body: "body",
    tag: null,
    published: false,
  });
});

test("article validation rejects a whitespace-only title without mutating state", () => {
  const state = {
    ...createPostEditorState("article"),
    title: "   ",
    body: "body",
  };

  assert.deepEqual(validatePostEditor(state), {
    ok: false,
    field: "title",
    message: "标题不能为空",
  });
  assert.equal(state.title, "   ");
  assert.equal(state.body, "body");
});

test("article validation rejects a whitespace-only body without mutating state", () => {
  const state = {
    ...createPostEditorState("article"),
    title: "Process notes",
    body: "   ",
  };

  assert.deepEqual(validatePostEditor(state), {
    ok: false,
    field: "body",
    message: "正文不能为空",
  });
  assert.equal(state.title, "Process notes");
  assert.equal(state.body, "   ");
});

test("article preview reuses the sanitized Markdown rendering pipeline", () => {
  const source = readFileSync(
    new URL("../components/admin/article-editor.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /MarkdownEditor/);
  assert.match(source, /MarkdownBody/);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML/);
});

test("News routes await route props and dispatch by exact type and title nullability", () => {
  const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
  const newPage = source("app/(admin)/dashboard/news/new/page.tsx");
  const editPage = source("app/(admin)/dashboard/news/[id]/edit/page.tsx");

  assert.match(newPage, /await searchParams/);
  assert.match(newPage, /type === "short"\)\s*\{\s*return <ShortPostEditor \/>;/);
  assert.match(newPage, /type === "article"\)\s*\{\s*return <ArticleEditor \/>;/);
  assert.match(newPage, /title="NEW"/);
  assert.match(newPage, /subtitle="新建内容"/);
  assert.match(newPage, /\/dashboard\/news\/new\?type=short/);
  assert.match(newPage, /\/dashboard\/news\/new\?type=article/);
  assert.match(editPage, /await params/);
  assert.match(editPage, /if \(!post\) notFound\(\)/);
  assert.match(editPage, /post\.title === null/);
  assert.match(editPage, /serializeAdminPost\(post\)/);
});
