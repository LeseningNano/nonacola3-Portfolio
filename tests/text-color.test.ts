import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

// Windows 下中文退回微软雅黑，font-light 会变成极细的 YaHei Light，ClearType 彩边让灰字发紫
test("Chinese subtitles never use a light font weight", () => {
  for (const file of ["components/section-heading.tsx", "app/works/[id]/page.tsx"]) {
    assert.doesNotMatch(read(file), /font-(light|extralight|thin)\b/, file);
  }
});

// 全站颗粒噪点盖在文字上方，必须是灰度噪点，不能带彩色
test("noise overlay is desaturated so it never tints grey text", () => {
  const css = read("app/globals.css");
  const noise = css.match(/body::after\s*\{[\s\S]*?\}/)?.[0] ?? "";
  assert.match(noise, /feTurbulence/);
  assert.match(noise, /feColorMatrix type='saturate' values='0'/);
});
