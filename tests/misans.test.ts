import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MarkdownBody } from "../components/markdown-body";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("MiSans regular, medium and semibold are self-hosted as unicode-range slices", () => {
  const css = read("app/misans.css");
  const faces = css.match(/@font-face\{[^}]*\}/g) ?? [];
  assert.ok(faces.length >= 100, `${faces.length} slices`);
  for (const weight of ["400", "500", "650"]) {
    assert.ok(faces.some((face) => face.includes(`font-weight:${weight}`)), `weight ${weight}`);
  }
  for (const face of faces) {
    assert.match(face, /font-family:MiSans/);
    assert.match(face, /font-display:swap/);
    assert.match(face, /unicode-range:/);
  }
  // 每个切片都指向 public/fonts/misans 里真实存在的文件（不依赖外部 CDN）
  const urls = [...css.matchAll(/url\('([^']+)'\)/g)].map((m) => m[1]);
  assert.equal(urls.length, faces.length);
  for (const url of urls) {
    assert.match(url, /^\/fonts\/misans\/MiSans-(Regular|Medium|Semibold)\.[a-f0-9]+\.\d+\.woff2$/);
    assert.ok(existsSync(new URL(`../public${url}`, import.meta.url)), url);
  }
  assert.doesNotMatch(css, /jsdelivr|googleapis/);
});

test("every site font falls back to MiSans for Chinese", () => {
  const layout = read("app/layout.tsx");
  assert.match(layout, /import "\.\/misans\.css";/);
  // Inter / Montserrat / Bitcount 都没有中文字形：中文落到 MiSans
  // next/font 参数必须是字面量，三处各写一遍
  assert.equal(layout.match(/fallback: \["MiSans", "PingFang SC", "Microsoft YaHei", "sans-serif"\]/g)?.length, 3);
});

test("article prose prefers MiSans and uses its real semibold weight for bold", () => {
  const css = read("app/globals.css");
  const prose = css.match(/\.article-prose\s*\{[^}]*\}/)?.[0] ?? "";
  assert.match(prose, /font-family: Inter, "Inter Fallback", MiSans,/);
  assert.doesNotMatch(css, /-webkit-text-stroke/, "no faux-bold stroke: it looked blurry on Microsoft YaHei");
  const markup = renderToStaticMarkup(createElement(MarkdownBody, { content: "普通 **加粗**" }));
  assert.match(markup, /<strong class="font-semibold text-white"/);
});

// 后台界面保持系统字体；后台的正文预览（.article-prose）仍用 MiSans，与前台一致
test("the admin interface keeps system fonts", () => {
  const css = read("app/globals.css");
  assert.match(css, /:root:has\(\[data-admin-theme\]\) body\s*\{[^}]*font-family: Inter, "Inter Fallback", "PingFang SC", "Microsoft YaHei", sans-serif/);
});
