import assert from "node:assert/strict";
import test from "node:test";
import type { VideoRow } from "../lib/types";
import {
  groupWorksByYear,
  normalizeShowreelType,
  selectFeaturedWorks,
} from "../lib/works-index";

function work(id: string, date: string | null, featured = false): VideoRow {
  return {
    id,
    title: id,
    description: null,
    summary: null,
    role: null,
    tools: null,
    category: "PV",
    embedUrl: "https://example.com/video",
    thumbnail: null,
    featured,
    order: 0,
    date,
  };
}

test("selected works preserves source order and has no hard cap", () => {
  const videos = [work("a", null, true), work("b", null), work("c", null, true), work("d", null, true), work("e", null, true)];
  assert.deepEqual(selectFeaturedWorks(videos).map(({ id }) => id), ["a", "c", "d", "e"]);
});

test("archive groups dated work newest-first and places undated work last", () => {
  const groups = groupWorksByYear([
    work("2025-a", "2025-03-01T00:00:00.000Z"),
    work("other", null),
    work("2026", "2026-01-01T00:00:00.000Z"),
    work("2025-b", "2025-01-01T00:00:00.000Z"),
  ]);
  assert.deepEqual(groups.map(({ label }) => label), ["2026", "2025", "Other"]);
  assert.deepEqual(groups[1].works.map(({ id }) => id), ["2025-a", "2025-b"]);
});

test("showreel type accepts upload and falls back to url", () => {
  assert.equal(normalizeShowreelType("upload"), "upload");
  assert.equal(normalizeShowreelType("url"), "url");
  assert.equal(normalizeShowreelType("unexpected"), "url");
  assert.equal(normalizeShowreelType(undefined), "url");
});
