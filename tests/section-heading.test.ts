import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SectionHeading } from "../components/section-heading";

test("SSR renders the full title and subtitle without a hidden state", () => {
  const markup = renderToStaticMarkup(
    createElement(SectionHeading, { title: "works.", subtitle: "精选视频作品与创作项目" })
  );
  assert.match(markup, /data-section-heading="static"/);
  assert.match(markup, /aria-label="works\."/);
  assert.match(markup, />works\.</);
  assert.match(markup, /精选视频作品与创作项目/);
  assert.match(markup, /--sub-delay:270ms/);
  assert.match(markup, /var\(--font-bitcount\)/);
  assert.doesNotMatch(markup, /pending/);
});

test("heading id is forwarded for aria-labelledby", () => {
  const markup = renderToStaticMarkup(
    createElement(SectionHeading, { id: "selected-works-heading", title: "selected." })
  );
  assert.match(markup, /<h2 id="selected-works-heading"/);
});

test("subtitle is optional", () => {
  const markup = renderToStaticMarkup(createElement(SectionHeading, { title: "about." }));
  assert.doesNotMatch(markup, /section-heading-sub/);
});

test("CSS wipes the subtitle horizontally only and respects reduced motion", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const start = css.indexOf("/* SectionHeading");
  const end = css.indexOf("/* end SectionHeading */");
  assert.ok(start >= 0 && end > start, "SectionHeading block exists");
  const block = css.slice(start, end);
  assert.match(block, /translateX\(-16px\)/);
  assert.doesNotMatch(block, /translateY/);
  assert.match(block, /clip-path: inset\(0 100% 0 0\)/);
  assert.match(block, /480ms/);
  assert.match(block, /prefers-reduced-motion: reduce/);
});

test("subtitle wipe interpolates between two inset() clips while playing", () => {
  // clip-path 从 inset() 到 none 无法插值，只会瞬间跳变；播放态必须同样是 inset()
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\[data-section-heading="play"\] \.section-heading-sub \{[^}]*clip-path: inset\(/);
});
