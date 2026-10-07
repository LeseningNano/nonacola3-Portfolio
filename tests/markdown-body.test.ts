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
  assert.match(markup, /<p class="mb-4">普通段落<\/p>/);
});

test("markdown elements do not leak the react-markdown node prop into the DOM", () => {
  const markup = renderToStaticMarkup(
    createElement(MarkdownBody, { content: "# 标题\n\n段落 [链接](https://example.com)\n\n![图](https://example.com/a.jpg)" })
  );
  assert.ok(!markup.includes("node="), markup);
});
