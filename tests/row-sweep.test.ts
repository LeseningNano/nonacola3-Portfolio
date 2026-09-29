import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NewsSection } from "../components/news-section";
import type { PostItem } from "../lib/types";

const post: PostItem = {
  id: "p1",
  title: "A post",
  body: "Body",
  tag: null,
  published: true,
  createdAt: new Date("2026-01-01").toISOString(),
};

test("news rows use the shared sweep hover instead of the old side bar", () => {
  const markup = renderToStaticMarkup(createElement(NewsSection, { posts: [post] }));
  assert.match(markup, /row-sweep/);
  assert.doesNotMatch(markup, /hover:bg-white\/5/);
  assert.doesNotMatch(markup, /before:bg-white/);
});

test("row sweep fills from the left, skips touch devices and respects reduced motion", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const start = css.indexOf("/* row-sweep");
  const end = css.indexOf("/* end row-sweep */");
  assert.ok(start >= 0 && end > start, "row-sweep block exists");
  const block = css.slice(start, end);
  assert.match(block, /transform-origin: left/);
  assert.match(block, /scaleX\(0\)/);
  assert.match(block, /@media \(hover: none\)/);
  assert.match(block, /prefers-reduced-motion: reduce/);
});
