import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MarkdownBody } from "../components/markdown-body";

test("an image paragraph renders its figure outside any <p> so hydration stays valid", () => {
  const markup = renderToStaticMarkup(
    createElement(MarkdownBody, { content: "开头文字\n![这是短片的某一帧](https://example.com/a.jpg)\n\n普通段落" })
  );

  assert.match(markup, /<figure/);
  assert.match(markup, /<figcaption[^>]*>这是短片的某一帧<\/figcaption>/);
  assert.doesNotMatch(markup, /<p[^>]*>(?:(?!<\/p>)[\s\S])*<figure/, "figure must not sit inside a <p>");
  assert.match(markup, /<p class="mb-\[1\.1em\]">普通段落<\/p>/);
});

test("markdown elements do not leak the react-markdown node prop into the DOM", () => {
  const markup = renderToStaticMarkup(
    createElement(MarkdownBody, { content: "# 标题\n\n段落 [链接](https://example.com)\n\n![图](https://example.com/a.jpg)" })
  );
  assert.ok(!markup.includes("node="), markup);
});

import { readFileSync } from "node:fs";

const render = (content: string) => renderToStaticMarkup(createElement(MarkdownBody, { content }));

// 文章页改版第 1 步：正文易读性（docs/superpowers/specs/2026-10-08-article-page-direction.md）
test("article prose uses roomier type with a CJK font fallback", () => {
  const markup = render("段落");
  assert.match(markup, /class="article-prose [^"]*text-base md:text-\[17px\] leading-\[1\.85\]/);

  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const block = css.match(/\.article-prose\s*\{[^}]*\}/)?.[0] ?? "";
  assert.match(block, /"Noto Sans SC", "PingFang SC"[^;]*"Microsoft YaHei"/);
});

test("headings separate by size and space rather than bold", () => {
  const markup = render("## 二级\n\n### 三级");
  assert.match(markup, /<h2 class="[^"]*font-normal[^"]*tracking-tight/);
  assert.doesNotMatch(markup, /<h2 class="[^"]*font-bold/);
  assert.match(markup, /<h3 class="[^"]*font-medium/);
});

test("lists hang their markers so wrapped lines align with the text", () => {
  const markup = render("- 一\n- 二\n\n1. 甲\n2. 乙");
  assert.match(markup, /<ul class="[^"]*list-outside[^"]*pl-5/);
  assert.match(markup, /<ol class="[^"]*list-outside[^"]*pl-5/);
  assert.doesNotMatch(markup, /list-inside/);
});

test("images sit in a bordered frame, capped in height, with a numbered caption", () => {
  const markup = render("![作品页顶部](https://e.com/a.png)\n\n![](https://e.com/b.png)");
  assert.equal(markup.match(/<figure/g)?.length, 2);
  assert.match(markup, /border border-neutral-800 bg-neutral-900\/40/);
  assert.match(markup, /<img[^>]*class="[^"]*max-h-\[80vh\][^"]*object-contain/);
  // 没写图注的图片也保留 figcaption，只显示编号
  assert.equal(markup.match(/<figcaption/g)?.length, 2);
  assert.match(markup, /<figcaption[^>]*>作品页顶部<\/figcaption>/);

  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.article-prose figure\s*\{[^}]*counter-increment:\s*article-figure/);
  assert.match(css, /\.article-prose figcaption::before\s*\{[^}]*"FIG\. " counter\(article-figure, decimal-leading-zero\)/);
});

test("videos get the same frame and numbering as images, outside any paragraph", () => {
  const markup = render('文字\n<video controls src="https://e.com/v.mp4"></video>');
  assert.match(markup, /<figure[^>]*>\s*<div class="[^"]*border border-neutral-800[^"]*">\s*<video/);
  assert.doesNotMatch(markup, /<p[^>]*>(?:(?!<\/p>)[\s\S])*<figure/);
});


// 图组：同一段里连续的图片（中间不空行）左右并排；空一行则照常上下排
test("adjacent images in one paragraph form a side-by-side gallery", () => {
  const markup = render("![甲](https://e.com/a.png)\n![乙](https://e.com/b.png)");
  assert.match(markup, /<div data-gallery="" class="[^"]*grid[^"]*md:grid-cols-2/);
  const gallery = markup.match(/<div data-gallery=""[\s\S]*?<\/figure>\s*<figure[\s\S]*?<\/figure>/)?.[0] ?? "";
  assert.equal(gallery.match(/<figure/g)?.length, 2, "both figures sit in the gallery");
  assert.doesNotMatch(markup, /<p[^>]*>(?:(?!<\/p>)[\s\S])*<figure/);
});

test("images separated by a blank line, or mixed with text, are not a gallery", () => {
  assert.doesNotMatch(render("![甲](https://e.com/a.png)\n\n![乙](https://e.com/b.png)"), /data-gallery/);
  assert.doesNotMatch(render("说明文字\n![甲](https://e.com/a.png)\n![乙](https://e.com/b.png)"), /data-gallery/);
  assert.doesNotMatch(render("![只有一张](https://e.com/a.png)"), /data-gallery/);
});
