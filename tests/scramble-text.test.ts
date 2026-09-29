import assert from "node:assert/strict";
import test from "node:test";
import {
  SCRAMBLE_GLYPHS,
  SCRAMBLE_SETTLE_MS,
  SCRAMBLE_STEP_MS,
  getScrambleDurationMs,
  getScrambleFrame,
  getSubtitleDelayMs,
} from "../lib/scramble-text";

const first = () => 0;

test("characters appear one by one on the 70ms step", () => {
  assert.equal(SCRAMBLE_STEP_MS, 70);
  assert.equal(getScrambleFrame("works.", 0, first).length, 1);
  assert.equal(getScrambleFrame("works.", SCRAMBLE_STEP_MS * 2, first).length, 3);
});

test("each character shows a glyph until it settles 350ms after appearing", () => {
  assert.equal(SCRAMBLE_SETTLE_MS, 350);
  assert.equal(getScrambleFrame("works.", 0, first), SCRAMBLE_GLYPHS[0]);
  assert.equal(getScrambleFrame("works.", SCRAMBLE_SETTLE_MS, first)[0], "w");
});

test("the full title is shown once the last character settles", () => {
  assert.equal(getScrambleDurationMs("works."), 5 * 70 + 350);
  assert.equal(getScrambleFrame("works.", getScrambleDurationMs("works."), first), "works.");
});

test("subtitle starts halfway through the title", () => {
  assert.equal(getSubtitleDelayMs("works."), 3 * 70 + 60);
  assert.equal(getSubtitleDelayMs("selected."), 4 * 70 + 60);
});

test("handles empty, CJK and spaced titles", () => {
  assert.equal(getScrambleFrame("", 1000, first), "");
  assert.equal(getScrambleDurationMs(""), 0);
  assert.equal(getScrambleFrame("全部 作品", 10_000, first), "全部 作品");
  // 空格不参与乱码
  assert.equal(getScrambleFrame("a b", 2 * 70, first)[1], " ");
});

test("an out-of-range random value never yields an undefined glyph", () => {
  assert.equal(getScrambleFrame("ab", 0, () => 1), SCRAMBLE_GLYPHS[SCRAMBLE_GLYPHS.length - 1]);
});
