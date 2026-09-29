import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SelectedWorksReel } from "../components/works-index/selected-works-reel";
import { WorksLanguageProvider } from "../components/works-index/works-language-provider";
import { shouldPassWheelToHorizontalScroller } from "../components/smooth-scroll-container";
import { formatReelCounter, getReelIndex } from "../lib/works-index";
import type { VideoRow } from "../lib/types";

function work(id: string): VideoRow {
  return {
    id,
    title: `Work ${id}`,
    description: null,
    summary: null,
    role: null,
    tools: null,
    category: "PV",
    embedUrl: "https://example.com/video",
    thumbnail: null,
    featured: true,
    order: 0,
    date: "2026-01-01T00:00:00.000Z",
  };
}

test("reel index follows the nearest card and stays in range", () => {
  assert.equal(getReelIndex(0, 900, 3), 0);
  assert.equal(getReelIndex(420, 900, 3), 0);
  assert.equal(getReelIndex(480, 900, 3), 1);
  assert.equal(getReelIndex(1800, 900, 3), 2);
  assert.equal(getReelIndex(9999, 900, 3), 2);
  assert.equal(getReelIndex(-50, 900, 3), 0);
  assert.equal(getReelIndex(300, 0, 3), 0);
  assert.equal(getReelIndex(300, 900, 0), 0);
});

test("reel counter is zero-padded", () => {
  assert.deepEqual(formatReelCounter(0, 3), { current: "01", total: "03" });
  assert.deepEqual(formatReelCounter(11, 12), { current: "12", total: "12" });
});

test("reel renders a horizontal strip with counter, disabled first arrow and progress segments", () => {
  const markup = renderToStaticMarkup(
    createElement(SelectedWorksReel, {
      works: [work("a"), work("b"), work("c")],
      header: createElement("h2", null, "selected."),
    })
  );
  assert.match(markup, /selected\./);
  assert.match(markup, /data-horizontal-scroll/);
  assert.match(markup, /snap-x snap-mandatory/);
  assert.match(markup, /overflow-x-auto/);
  assert.equal(markup.match(/data-reel-item/g)?.length, 3);
  assert.match(markup, />01</);
  assert.match(markup, /\/ 03/);
  assert.match(markup, /aria-label="Previous work" disabled=""/);
  assert.match(markup, /aria-label="Next work"/);
  assert.doesNotMatch(markup, /aria-label="Next work" disabled/);
  assert.equal(markup.match(/data-reel-segment/g)?.length, 3);
  // 当前作品全亮，其余变暗；过渡在减少动态效果时关闭
  assert.equal(markup.match(/opacity-35/g)?.length, 2);
  assert.match(markup, /motion-reduce:transition-none/);
  // 卡片带 Bitcount 编号
  assert.match(markup, />02</);
  // 标题区较宽时，计数与按钮不被挤压换行
  assert.match(markup, /class="flex shrink-0 items-center gap-3"/);
  assert.match(markup, /whitespace-nowrap/);
});

test("a single selected work shows one large card without reel controls", () => {
  const markup = renderToStaticMarkup(
    createElement(SelectedWorksReel, { works: [work("solo")], header: createElement("h2", null, "selected.") })
  );
  assert.equal(markup.match(/data-reel-item/g)?.length, 1);
  assert.doesNotMatch(markup, /Previous work/);
  assert.doesNotMatch(markup, /data-reel-segment/);
  assert.doesNotMatch(markup, /snap-mandatory/);
});

test("reel controls are localized", () => {
  const markup = renderToStaticMarkup(
    createElement(
      WorksLanguageProvider,
      { initialLocale: "zh-CN" },
      createElement(SelectedWorksReel, { works: [work("a"), work("b")], header: null })
    )
  );
  assert.match(markup, /上一个作品/);
  assert.match(markup, /下一个作品/);
});

test("horizontal trackpad gestures inside the reel bypass the custom wheel scroll", () => {
  assert.equal(shouldPassWheelToHorizontalScroller(40, 5, true), true);
  assert.equal(shouldPassWheelToHorizontalScroller(5, 40, true), false);
  assert.equal(shouldPassWheelToHorizontalScroller(40, 5, false), false);
});
