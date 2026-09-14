import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as smoothScrollModule from "../components/smooth-scroll-container";

const { SmoothScrollContainer } = smoothScrollModule;

test("exports the shared curved-scroll container used by portfolio pages", () => {
  const markup = renderToStaticMarkup(
    createElement(SmoothScrollContainer, null, createElement("p", null, "content"))
  );

  assert.match(markup, /data-smooth-scroll="true"/);
  assert.match(markup, /md:h-screen/);
  assert.match(markup, /md:overflow-y-auto/);
});

test("uses the native smooth-scroll fallback on mobile and reduced-motion desktop", () => {
  const module = smoothScrollModule as typeof smoothScrollModule & {
    shouldUseNativeSmoothScroll?: (desktop: boolean, reducedMotion: boolean) => boolean;
  };

  assert.equal(typeof module.shouldUseNativeSmoothScroll, "function");
  assert.equal(module.shouldUseNativeSmoothScroll!(false, false), true);
  assert.equal(module.shouldUseNativeSmoothScroll!(true, true), true);
  assert.equal(module.shouldUseNativeSmoothScroll!(true, false), false);
});

test("does not claim scroll keys from interactive controls", () => {
  const module = smoothScrollModule as typeof smoothScrollModule & {
    shouldIgnoreScrollKey?: (
      tagName: string,
      isContentEditable: boolean,
      defaultPrevented: boolean
    ) => boolean;
  };

  assert.equal(typeof module.shouldIgnoreScrollKey, "function");
  for (const tagName of ["BUTTON", "SELECT", "INPUT", "TEXTAREA", "A"]) {
    assert.equal(module.shouldIgnoreScrollKey!(tagName, false, false), true);
  }
  assert.equal(module.shouldIgnoreScrollKey!("DIV", true, false), true);
  assert.equal(module.shouldIgnoreScrollKey!("DIV", false, true), true);
  assert.equal(module.shouldIgnoreScrollKey!("BODY", false, false), false);
});
