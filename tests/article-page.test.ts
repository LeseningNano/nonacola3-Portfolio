import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MarkdownBody } from "../components/markdown-body";
import { formatFullDate } from "../lib/news-timeline";
import { getArticleNeighbors } from "../lib/news-neighbors";
import { finishRestore, markBack, planReturn, takeRestore, RESTORE_KEY, scrollPosKey } from "../lib/return-navigation";
import { WorkReturnLinkView } from "../components/work-return-link";
import type { PostItem } from "../lib/types";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const page = read("app/news/[id]/page.tsx");
const css = read("app/globals.css");

// ---- 版心：和作品详情页一样的单栏（max-w-5xl），文字与图片同宽 ----
test("article page uses the same single column as the work detail page", () => {
  assert.match(page, /max-w-5xl mx-auto/);
  assert.match(read("app/works/[id]/page.tsx"), /max-w-5xl mx-auto/);
  assert.match(page, /<MarkdownBody content=\{post\.body\} \/>/);
  assert.doesNotMatch(page, /max-w-\[(38|52)rem\]/);
  assert.doesNotMatch(css, /wide-media/);
  assert.doesNotMatch(renderToStaticMarkup(createElement(MarkdownBody, { content: "段落" })), /data-layout/);
});

// ---- 第 3 步：标题区 ----
test("article dates use the dotted format shared with the news timeline", () => {
  assert.equal(formatFullDate("2026-10-07T12:00:00+08:00"), "2026.10.07");
});

test("article header uses a quiet meta line and a regular-weight title", () => {
  assert.match(page, /formatFullDate\(post\.createdAt\)/);
  assert.match(page, /tracking-\[0\.24em\]/);
  assert.match(page, /<h1 className="[^"]*font-normal[^"]*tracking-\[-0\.03em\][^"]*md:text-\[56px\]/);
  assert.doesNotMatch(page, /font-bold/);
  assert.doesNotMatch(page, /border border-neutral-700 px-2/, "tag no longer boxed");
});

// ---- 第 4 步：上一篇 / 下一篇 ----
const post = (id: string, iso: string, title: string | null, published = true): PostItem => ({
  id, title, body: "b", tag: null, published, createdAt: new Date(iso).toISOString(),
});
const posts = [
  post("new", "2026-10-07", "最新"),
  post("short", "2026-09-01", null),
  post("draft", "2026-08-20", "草稿", false),
  post("mid", "2026-08-06", "中间"),
  post("old", "2026-07-20", "最早"),
];

test("neighbors skip short updates and drafts, ordered by date", () => {
  assert.deepEqual(getArticleNeighbors(posts, "mid"), {
    older: { id: "old", title: "最早" },
    newer: { id: "new", title: "最新" },
  });
  assert.deepEqual(getArticleNeighbors(posts, "new"), { older: { id: "mid", title: "中间" }, newer: null });
  assert.deepEqual(getArticleNeighbors(posts, "old"), { older: null, newer: { id: "mid", title: "中间" } });
});

test("article page ends with prev/next and a return to News", () => {
  assert.match(page, /getArticleNeighbors/);
  assert.match(page, /PREV/);
  assert.match(page, /NEXT/);
  assert.match(page, /<ReturnLink[^>]*page="home"[^>]*section="news"/);
  assert.match(page, /返回 News/);
});

// ---- 第 4 步：返回原位置 / 所属板块 ----
function memoryStorage(seed: Record<string, string> = {}) {
  const data = new Map(Object.entries(seed));
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    data,
  };
}

test("returning restores the saved position when there is one", () => {
  const storage = memoryStorage({ [scrollPosKey("home")]: "1840" });
  assert.equal(planReturn(storage, "home", "news", 1_000), "restore");
  assert.equal(storage.getItem(RESTORE_KEY), "home:1000");
  assert.equal(storage.getItem("pending-scroll"), null);
  // 开发模式下组件会挂载两次：读取不删除，第二次仍能拿到
  assert.equal(takeRestore(storage, "home", 1_500), 1840);
  assert.equal(takeRestore(storage, "home", 1_600), 1840);
  // 恢复完成（或用户开始滚动）后才清掉，只生效一次
  finishRestore(storage);
  assert.equal(takeRestore(storage, "home", 1_700), null);
});

test("a return flag left behind expires", () => {
  const storage = memoryStorage({ [scrollPosKey("home")]: "1840" });
  planReturn(storage, "home", "news", 1_000);
  assert.equal(takeRestore(storage, "home", 60_000), null);
  assert.equal(storage.getItem(RESTORE_KEY), null, "stale flag is cleared");
});

test("without a saved position the return falls back to the section", () => {
  const storage = memoryStorage();
  assert.equal(planReturn(storage, "home", "works"), "section");
  assert.equal(storage.getItem("pending-scroll"), "works");
  assert.equal(takeRestore(storage, "home"), null);
  // /works 没有板块：退回顶部
  assert.equal(planReturn(memoryStorage(), "works"), "top");
});

test("browser back restores whichever page it lands on, but only right after the back press", () => {
  const storage = memoryStorage({ [scrollPosKey("works")]: "900" });
  markBack(storage, 1_000);
  assert.equal(takeRestore(storage, "works", 2_000), 900);
  finishRestore(storage);
  assert.equal(storage.getItem(RESTORE_KEY), null);

  // 后退落在文章页（没有 ScrollMemory），标记过期后不应影响之后的普通访问
  markBack(storage, 1_000);
  assert.equal(takeRestore(storage, "works", 60_000), null);
  assert.equal(storage.getItem(RESTORE_KEY), null, "stale flag is cleared");
});

test("a restore flag for another page is left alone", () => {
  const storage = memoryStorage({ [scrollPosKey("works")]: "900", [RESTORE_KEY]: "home:1000" });
  assert.equal(takeRestore(storage, "works", 1_500), null);
  assert.equal(storage.getItem(RESTORE_KEY), "home:1000");
});

test("home and works remember their scroll and back navigation is flagged", () => {
  assert.match(read("components/home-client.tsx"), /<ScrollMemory page="home" \/>/);
  assert.match(read("app/works/page.tsx"), /<ScrollMemory page="works" \/>/);
  assert.match(read("app/layout.tsx"), /<BackNavigationFlag \/>/);
});

test("work return links go back to the homepage works section or the works index", () => {
  const home = renderToStaticMarkup(createElement(WorkReturnLinkView, { from: "home" }));
  assert.match(home, /href="\/"/);
  assert.match(home, /data-return-page="home"/);
  assert.match(home, /data-return-section="works"/);

  const works = renderToStaticMarkup(createElement(WorkReturnLinkView, { from: null }));
  assert.match(works, /href="\/works"/);
  assert.match(works, /data-return-page="works"/);
});

// 黑场过渡在 document 捕获阶段拦截站内链接并 stopPropagation，链接自己的 onClick 不会执行，
// 所以由过渡处理器替「返回」链接记下返回意图
test("the page transition records return intent for return links it intercepts", () => {
  const transition = read("components/progress-bar.tsx");
  assert.match(transition, /dataset\.returnPage/);
  assert.match(transition, /planReturn\(/);
});
