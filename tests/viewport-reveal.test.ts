import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Reveal, shouldSkipRevealMotion } from "../components/viewport-reveal";

test("SSR markup keeps reveal content visible without JavaScript", () => {
  const heading = renderToStaticMarkup(
    createElement(Reveal, { variant: "heading" }, "works.")
  );
  const content = renderToStaticMarkup(
    createElement(Reveal, { variant: "content" }, "精选视频作品与创作项目")
  );

  for (const markup of [heading, content]) {
    // 隐藏态只能由浏览器端 effect 添加；SSR 输出不能包含任何隐藏状态
    assert.ok(!markup.includes("data-reveal-pending"), `no pending state: ${markup}`);
    assert.ok(!/opacity:\s*0/.test(markup), `no inline opacity 0: ${markup}`);
  }

  assert.match(heading, /works\./);
  assert.match(content, /精选视频作品与创作项目/);
});

test("heading variant exposes the mask inner element for the CSS reveal", () => {
  const markup = renderToStaticMarkup(
    createElement(Reveal, { variant: "heading" }, "works.")
  );

  assert.match(markup, /data-reveal="heading"/);
  assert.match(markup, /reveal-inner/);
});

test("content variant carries the variant marker for CSS transitions", () => {
  const markup = renderToStaticMarkup(
    createElement(Reveal, { variant: "content", delay: 180 }, "正文")
  );

  assert.match(markup, /data-reveal="content"/);
  assert.match(markup, /--reveal-delay:180ms/);
});

test("reduced motion skips the reveal animation entirely", () => {
  assert.equal(shouldSkipRevealMotion(true), true);
  assert.equal(shouldSkipRevealMotion(false), false);
});
