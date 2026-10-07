import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

// 作品编辑器：Case Study 和文章编辑器一样带实时预览
test("work editor shows a live preview of the case study", () => {
  const source = read("components/admin/work-editor.tsx");
  assert.match(source, /实时预览/);
  assert.match(source, /<MarkdownBody content=\{state\.form\.description\} \/>/);
  assert.match(source, /aria-labelledby="work-preview-label"/);
});

// 粗体规则见 tests/misans.test.ts（MiSans 有真正的中等字重，不再用描边）

// 标题统一（方案 1）：作品详情页与文章页同一套标题区，作品标题略小
test("work detail header matches the article header with a slightly smaller title", () => {
  const page = read("app/works/[id]/page.tsx");
  assert.match(page, /formatFullDate\(video\.date\)/);
  assert.match(page, /tracking-\[0\.24em\]/);
  assert.match(page, /<h1 className="[^"]*font-normal[^"]*tracking-\[-0\.03em\][^"]*md:text-\[44px\]/);
  assert.doesNotMatch(page, /font-bold/);
  assert.doesNotMatch(page, /border border-neutral-700 px-2/, "category no longer boxed");
  assert.doesNotMatch(page, /toLocaleDateString/);
});
