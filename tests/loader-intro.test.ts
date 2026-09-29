import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LoadingScreen } from "../components/loading-screen";
import {
  LOADER_COUNT_MS,
  LOADER_CURTAIN_MS,
  LOADER_MAX_FRAME_MS,
  advanceLoaderClock,
  formatLoaderPercent,
  getLoaderMorphFrame,
  getLoaderPercent,
  getLoaderState,
  getLoaderTimeline,
  shouldSkipLoader,
} from "../lib/loader-intro";
import { SCRAMBLE_GLYPHS } from "../lib/scramble-text";

const first = () => 0;

test("loader percent is zero-padded and clamped", () => {
  assert.equal(formatLoaderPercent(0), "000%");
  assert.equal(formatLoaderPercent(47.9), "047%");
  assert.equal(formatLoaderPercent(100), "100%");
  assert.equal(formatLoaderPercent(140), "100%");
  assert.equal(formatLoaderPercent(-3), "000%");
});

test("loader percent eases out, never decreases and reaches 100 at the end of the count", () => {
  assert.equal(getLoaderPercent(0), 0);
  assert.equal(getLoaderPercent(LOADER_COUNT_MS), 100);
  assert.ok(getLoaderPercent(LOADER_COUNT_MS / 2) > 50, "eases out");
  let last = -1;
  for (let t = 0; t <= LOADER_COUNT_MS; t += 25) {
    const value = getLoaderPercent(t);
    assert.ok(value >= last, `monotonic at ${t}ms`);
    last = value;
  }
});

test("morph scrambles every 100% position at once, then grows and settles into the name", () => {
  const start = getLoaderMorphFrame("100%", "nonacola3", 0, first);
  assert.equal(start, SCRAMBLE_GLYPHS[0].repeat(4));
  assert.equal(getLoaderMorphFrame("100%", "nonacola3", 250, first)[0], "n");
  assert.equal(getLoaderMorphFrame("100%", "nonacola3", 250 + 8 * 70, first), "nonacola3");
  // 目标比来源短时，多余位置直接消失
  assert.equal(getLoaderMorphFrame("100%", "ab", 10_000, first), "ab");
});

test("loader timeline runs count → full → morph → hold → seam → open → done", () => {
  const name = "nonacola3";
  const { fullAt, morphAt, holdAt, seamAt, revealAt, doneAt } = getLoaderTimeline(name);
  assert.deepEqual(
    [fullAt, morphAt, holdAt, seamAt, revealAt, doneAt],
    [1000, 1180, 1990, 2190, 2410, 3110]
  );
  assert.equal(doneAt - revealAt, LOADER_CURTAIN_MS);

  assert.deepEqual(getLoaderState(0, name, first), { phase: "count", text: "000%", progress: 0 });
  assert.deepEqual(getLoaderState(fullAt + 1, name, first), { phase: "full", text: "100%", progress: 1 });
  assert.equal(getLoaderState(morphAt, name, first).phase, "morph");
  assert.deepEqual(getLoaderState(holdAt, name, first), { phase: "hold", text: name, progress: 1 });
  assert.equal(getLoaderState(seamAt, name, first).phase, "seam");
  assert.equal(getLoaderState(revealAt, name, first).phase, "open");
  assert.equal(getLoaderState(doneAt, name, first).phase, "done");
});

test("the loader is skipped on return visits and under reduced motion", () => {
  assert.equal(shouldSkipLoader(false, false), false);
  assert.equal(shouldSkipLoader(true, false), true);
  assert.equal(shouldSkipLoader(false, true), true);
});

test("loader SSR starts from the counter with the slim footer and no credits panel", () => {
  const markup = renderToStaticMarkup(
    createElement(LoadingScreen, { onReveal: () => {}, onDone: () => {} })
  );
  assert.match(markup, /data-loader-phase="count"/);
  assert.match(markup, />000%</);
  assert.match(markup, /VIDEO PORTFOLIO/);
  assert.match(markup, /VER 04/);
  assert.match(markup, /loader-panel-top/);
  assert.match(markup, /loader-panel-bottom/);
  assert.match(markup, /loader-seam/);
  assert.doesNotMatch(markup, /CODING/);
});

test("loader timeline cannot be interrupted by parent re-renders", () => {
  const source = readFileSync(new URL("../components/loading-screen.tsx", import.meta.url), "utf8");
  // 回调放进 ref，时间线 effect 只在挂载时启动
  assert.match(source, /useRef\(onReveal\)/);
  assert.match(source, /useRef\(onDone\)/);
  assert.match(source, /requestAnimationFrame\(tick\)/);
  assert.match(source, /\}, \[\]\);/);
  assert.doesNotMatch(source, /\[progress, onReady\]/);
});

test("loader curtain CSS matches the timeline and respects reduced motion", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const start = css.indexOf("/* 首访加载画面");
  const end = css.indexOf("/* end 首访加载画面 */");
  assert.ok(start >= 0 && end > start, "loader block exists");
  const block = css.slice(start, end);
  assert.match(block, /transform 700ms/);
  assert.match(block, /\[data-loader-phase="open"\] \.loader-panel-top[^{]*\{[^}]*translateY\(-100%\)/);
  assert.match(block, /\[data-loader-phase="open"\] \.loader-panel-bottom[^{]*\{[^}]*translateY\(100%\)/);
  assert.match(block, /prefers-reduced-motion: reduce/);
});

test("hero wires the loader reveal to the name intro and skips it when appropriate", () => {
  const source = readFileSync(new URL("../components/hero-video.tsx", import.meta.url), "utf8");
  assert.match(source, /shouldSkipLoader\(/);
  assert.match(source, /onReveal=\{handleLoaderReveal\}/);
  assert.match(source, /onDone=\{handleLoaderDone\}/);
  assert.doesNotMatch(source, /fadeOut/);
});

test("a blocked main thread slows the loader down instead of skipping stages", () => {
  // 主线程卡住后恢复时，单帧最多推进 LOADER_MAX_FRAME_MS，计数和解码不会被整段跳过
  assert.equal(LOADER_MAX_FRAME_MS, 100);
  assert.equal(advanceLoaderClock(0, 16), 16);
  assert.equal(advanceLoaderClock(100, 5000), 200);
  assert.equal(advanceLoaderClock(0, 80), 80);
  assert.equal(advanceLoaderClock(100, -20), 100);
  const source = readFileSync(new URL("../components/loading-screen.tsx", import.meta.url), "utf8");
  assert.match(source, /advanceLoaderClock\(/);
});
