import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getPostExcerpt } from "../lib/post-excerpt";
import { NewsSection } from "../components/news-section";
import { AboutSection } from "../components/about-section";
import { VideoGrid } from "../components/video-grid";
import { Footer } from "../components/footer";
import type { PostItem } from "../lib/types";

const article: PostItem = {
  id: "a1",
  title: "关于网站访问速度缓慢",
  body: "## 说明\n\n最近**部分地区**访问较慢，详见[公告](https://example.com)。\n\n![图](https://example.com/a.png)\n\n- 第一条",
  tag: "公告",
  published: true,
  createdAt: new Date("2026-07-20").toISOString(),
};

test("post excerpt strips markdown syntax and collapses whitespace", () => {
  assert.equal(getPostExcerpt(article.body), "说明 最近部分地区访问较慢，详见公告。 第一条");
});

test("post excerpt drops raw html and code fences", () => {
  assert.equal(getPostExcerpt("<p>你好</p>\n```js\nconst a = 1;\n```\n`x` 结束"), "你好 x 结束");
});

test("post excerpt is cut with an ellipsis past the limit", () => {
  const excerpt = getPostExcerpt("一".repeat(300), 120);
  assert.equal(excerpt.length, 121);
  assert.ok(excerpt.endsWith("…"));
});

test("homepage sections and footer share a 1920px content cap", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.page-cap\s*\{[^}]*max-width:\s*1792px/);

  const parts = [
    renderToStaticMarkup(createElement(VideoGrid, { videos: [] })),
    renderToStaticMarkup(createElement(NewsSection, { posts: [] })),
    renderToStaticMarkup(createElement(AboutSection)),
    renderToStaticMarkup(createElement(Footer)),
  ];
  for (const markup of parts) assert.match(markup, /class="page-cap/);
});

test("about grows avatar and bio on very wide screens", () => {
  const markup = renderToStaticMarkup(createElement(AboutSection));
  assert.match(markup, /2xl:h-60 2xl:w-60/);
  assert.match(markup, /2xl:text-xl/);
});

test("navbar content stays full width until its background appears, then glides into the 1920 cap", async () => {
  const { getNavbarInnerClass } = await import("../lib/portfolio-navigation");

  const open = getNavbarInnerClass(false);
  const capped = getNavbarInnerClass(true);

  assert.match(open, /max-w-full/);
  assert.match(open, /md:px-6/);
  assert.match(capped, /max-w-\[1920px\]/);
  assert.match(capped, /md:px-12 lg:px-16/);
  for (const cls of [open, capped]) {
    assert.match(cls, /mx-auto/);
    assert.match(cls, /transition-\[max-width,padding\]/);
    assert.match(cls, /motion-reduce:transition-none/);
  }
});

test("post excerpt drops horizontal rules", () => {
  assert.equal(getPostExcerpt("具体如下：\n\n---\n\n1. 新增作品页面\n\n***\n\n结尾"), "具体如下： 新增作品页面 结尾");
});
