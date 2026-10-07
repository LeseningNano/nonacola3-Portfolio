import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MarkdownBody } from "../components/markdown-body";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const layout = read("app/layout.tsx");
const css = read("app/globals.css");

// 中文字体：思源黑体（Noto Sans SC，可变字重）。MiSans 在 Windows 上正文渲染偏粗发糊，已移除。
test("Noto Sans SC is loaded through next/font as a variable font", () => {
  assert.match(layout, /import \{[^}]*Noto_Sans_SC[^}]*\} from "next\/font\/google";/);
  assert.match(layout, /const notoSansSC = Noto_Sans_SC\(\{[^}]*variable: "--font-noto-sans-sc"[^}]*preload: false[^}]*\}\);/);
  assert.match(layout, /\$\{notoSansSC\.variable\}/, "font CSS is attached to the page");
});

test("every site font falls back to Noto Sans SC for Chinese", () => {
  // next/font 参数必须是字面量，三处各写一遍
  assert.equal(layout.match(/fallback: \["Noto Sans SC", "PingFang SC", "Microsoft YaHei", "sans-serif"\]/g)?.length, 3);
});

test("MiSans is gone", () => {
  assert.ok(!existsSync(new URL("../app/misans.css", import.meta.url)));
  assert.ok(!existsSync(new URL("../public/fonts/misans", import.meta.url)));
  assert.doesNotMatch(layout + css, /MiSans|misans/);
});

test("article prose prefers Noto Sans SC and uses its semibold for bold", () => {
  const prose = css.match(/\.article-prose\s*\{[^}]*\}/)?.[0] ?? "";
  assert.match(prose, /font-family: Inter, "Inter Fallback", "Noto Sans SC",/);
  assert.doesNotMatch(css, /-webkit-text-stroke/);
  const markup = renderToStaticMarkup(createElement(MarkdownBody, { content: "普通 **加粗**" }));
  assert.match(markup, /<strong class="font-semibold text-white"/);
});

// 后台界面保持系统字体；后台的正文预览（.article-prose）与前台一致
test("the admin interface keeps system fonts", () => {
  assert.match(css, /:root:has\(\[data-admin-theme\]\) body\s*\{[^}]*font-family: Inter, "Inter Fallback", "PingFang SC", "Microsoft YaHei", sans-serif/);
});
