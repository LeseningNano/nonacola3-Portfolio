import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { VideoGrid } from "../components/video-grid";
import { HOME_WORKS_LIMIT, selectHomeWorks } from "../lib/works-index";
import type { VideoRow } from "../lib/types";

function video(id: string): VideoRow {
  return {
    id,
    title: `Work ${id}`,
    description: null,
    summary: null,
    role: null,
    tools: null,
    category: "PV",
    embedUrl: "",
    thumbnail: null,
    featured: false,
    order: 0,
    date: "2025-06-01T00:00:00.000Z",
  };
}

test("home shows at most six works in admin order", () => {
  const videos = Array.from({ length: 8 }, (_, i) => video(`v${i}`));
  assert.equal(HOME_WORKS_LIMIT, 6);
  assert.deepEqual(selectHomeWorks(videos).map((v) => v.id), ["v0", "v1", "v2", "v3", "v4", "v5"]);
  assert.deepEqual(selectHomeWorks([video("a")]).map((v) => v.id), ["a"]);
});

test("home works grid staggers card reveals by column and hides the 4th+ card on phones", () => {
  const markup = renderToStaticMarkup(
    createElement(VideoGrid, { videos: Array.from({ length: 4 }, (_, i) => video(`v${i}`)) })
  );
  assert.equal(markup.match(/data-reveal="card"/g)?.length, 4);
  assert.match(markup, /--reveal-delay:100ms/);
  assert.match(markup, /--reveal-delay:200ms/);
  assert.equal(markup.match(/hidden sm:block/g)?.length, 1);
  assert.match(markup, /href="\/works\/v0\?from=home"/);
  assert.match(markup, /PV · 2025/);
  assert.match(markup, /lg:grid-cols-3/);
  assert.doesNotMatch(markup, /animate-marquee/);
  assert.doesNotMatch(markup, /显示全部作品/);
});

test("fewer than four works never hides a card", () => {
  const markup = renderToStaticMarkup(
    createElement(VideoGrid, { videos: [video("a"), video("b")] })
  );
  assert.doesNotMatch(markup, /hidden sm:block/);
});

test("home works section shows a message instead of an empty grid", () => {
  const markup = renderToStaticMarkup(createElement(VideoGrid, { videos: [] }));
  assert.match(markup, /作品正在更新中。/);
  assert.doesNotMatch(markup, /data-reveal="card"/);
  assert.match(markup, /ALL WORKS/);
});

test("REEL strip keeps the showreel entry with a breathing ring", () => {
  const markup = renderToStaticMarkup(createElement(VideoGrid, { videos: [video("a")] }));
  assert.match(markup, /REEL/);
  assert.match(markup, /视觉创作总结/);
  assert.match(markup, /pulse-ring/);
});

test("breathing ring CSS respects reduced motion and marquee styles are gone", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /@keyframes pulse-ring/);
  assert.match(css, /\.pulse-ring::before,\s*\.pulse-ring::after \{[^}]*animation: none/);
  assert.doesNotMatch(css, /animate-marquee/);
  assert.doesNotMatch(css, /works-expand/);
});
