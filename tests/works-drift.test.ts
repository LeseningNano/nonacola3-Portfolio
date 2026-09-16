import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  WorksDrift,
  clamp01,
  driftOffset,
  shouldRunDrift,
} from "../components/works-drift";

test("drift progress is clamped to the viewport passage range", () => {
  assert.equal(clamp01(-1), 0);
  assert.equal(clamp01(0.4), 0.4);
  assert.equal(clamp01(2), 1);
});

test("drift offset stays within the approved ±7px budget", () => {
  for (let p = 0; p <= 1; p += 0.05) {
    const offset = driftOffset(p);
    assert.ok(Math.abs(offset) <= 7, `progress ${p} -> ${offset}`);
  }
  assert.equal(driftOffset(0.5), 0);
  assert.equal(driftOffset(0), 7);
  assert.equal(driftOffset(1), -7);
});

test("drift runs only on desktop without reduced motion", () => {
  assert.equal(shouldRunDrift(true, false), true);
  assert.equal(shouldRunDrift(false, false), false);
  assert.equal(shouldRunDrift(true, true), false);
});

test("drift wrapper renders plain content in SSR with no transform", () => {
  const markup = renderToStaticMarkup(
    createElement(WorksDrift, null, createElement("p", null, "media"))
  );

  assert.match(markup, /media/);
  assert.ok(!/style="/.test(markup), `no inline transform in SSR: ${markup}`);
  assert.ok(!markup.includes("data-reveal-pending"));
});
