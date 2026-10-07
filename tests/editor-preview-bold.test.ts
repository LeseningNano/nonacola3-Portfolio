import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MarkdownBody } from "../components/markdown-body";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

// 作品编辑器：Case Study 和文章编辑器一样带实时预览
test("work editor shows a live preview of the case study", () => {
  const source = read("components/admin/work-editor.tsx");
  assert.match(source, /实时预览/);
  assert.match(source, /<MarkdownBody content=\{state\.form\.description\} \/>/);
  assert.match(source, /aria-labelledby="work-preview-label"/);
});

// 粗体要看得出来
test("bold text is clearly heavier than body text", () => {
  const markup = renderToStaticMarkup(createElement(MarkdownBody, { content: "普通 **加粗** 普通" }));
  assert.match(markup, /<strong class="[^"]*font-semibold[^"]*text-white/);
});
