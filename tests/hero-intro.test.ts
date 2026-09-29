import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HeroVideo } from "../components/hero-video";
import { siteConfig } from "../lib/config";
import {
  HERO_BUTTON_DELAY_MS,
  HERO_SUBTITLE_DELAY_MS,
  resolvePendingIntroPhase,
  getHeroLetters,
} from "../lib/hero-intro";

test("hero letters stagger by 40ms", () => {
  assert.deepEqual(getHeroLetters("abc"), [
    { char: "a", delayMs: 0 },
    { char: "b", delayMs: 40 },
    { char: "c", delayMs: 80 },
  ]);
  assert.deepEqual(getHeroLetters(""), []);
});

test("subtitle and button follow the name tightly", () => {
  assert.equal(HERO_SUBTITLE_DELAY_MS, 160);
  assert.equal(HERO_BUTTON_DELAY_MS, 280);
});

test("hero SSR renders the name as masked letters without a hidden state", () => {
  const markup = renderToStaticMarkup(createElement(HeroVideo, { videoUrl: null }));
  assert.match(markup, new RegExp(`aria-label="${siteConfig.name}"`));
  assert.equal(markup.match(/class="hero-letter"/g)?.length, Array.from(siteConfig.name).length);
  assert.match(markup, /data-hero-intro="static"/);
  assert.match(markup, /--intro-delay:40ms/);
  assert.match(markup, /--intro-delay:160ms/);
  assert.match(markup, /--intro-delay:280ms/);
  assert.doesNotMatch(markup, /data-hero-intro="pending"/);
  // 现有文案与结构不变
  assert.match(markup, /跳转至 works\./);
  assert.match(markup, /data-mobile-hero-primary="true"/);
});

test("hero intro CSS masks letters and has a reduced-motion fallback", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const start = css.indexOf("/* Hero 入场");
  const end = css.indexOf("/* end Hero 入场 */");
  assert.ok(start >= 0 && end > start, "hero intro block exists");
  const block = css.slice(start, end);
  assert.match(block, /\[data-hero-intro="pending"\] \.hero-letter \{[^}]*translateY\(110%\)/);
  assert.match(block, /prefers-reduced-motion: reduce/);
  assert.match(block, /\.hero-letter,\s*\.hero-sub \{[^}]*transition: none !important/);
});

test("the intro only enters pending before the loader has finished", () => {
  // 后台标签页里 rAF 被推迟，加载层可能先完成；迟到的 pending 不能把已经升起的名字再藏起来
  assert.equal(resolvePendingIntroPhase("static", false), "pending");
  assert.equal(resolvePendingIntroPhase("static", true), "static");
  assert.equal(resolvePendingIntroPhase("play", false), "play");
  assert.equal(resolvePendingIntroPhase("play", true), "play");
  const source = readFileSync(new URL("../components/hero-video.tsx", import.meta.url), "utf8");
  assert.match(source, /resolvePendingIntroPhase\(/);
  assert.match(source, /cancelAnimationFrame\(introFrame\)/);
});
