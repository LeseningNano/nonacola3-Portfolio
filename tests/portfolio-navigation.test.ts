import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HeroVideo } from "../components/hero-video";
import { VideoGrid } from "../components/video-grid";
import { VideoCard } from "../components/video-card";
import {
  getActiveNavSection,
  getPortfolioMenuPrimary,
  getScrollProgress,
  shouldGateNavbarOnIntro,
  shouldShowScrollProgress,
  shouldShowServerNotice,
  shouldUseBlackTransition,
} from "../lib/portfolio-navigation";
import type { VideoRow } from "../lib/types";

const sampleVideo: VideoRow = {
  id: "v1",
  title: "Sample work",
  description: null,
  summary: null,
  role: null,
  tools: null,
  category: "",
  embedUrl: "",
  thumbnail: null,
  featured: false,
  order: 0,
  date: null,
};

test("homepage hero call to action links to the Works index", () => {
  const markup = renderToStaticMarkup(createElement(HeroVideo, { videoUrl: null }));

  assert.match(markup, /href="\/works"/);
  assert.match(markup, /跳转至 works\./);
});

test("homepage hero shows a scroll hint beside the call to action", () => {
  const markup = renderToStaticMarkup(createElement(HeroVideo, { videoUrl: null }));

  assert.match(markup, /SCROLL/);
  assert.match(markup, /animate-bounce/);
  assert.match(markup, /motion-reduce:animate-none/);
});

test("homepage Hero supports a custom poster and retains the bundled fallback", () => {
  const custom = renderToStaticMarkup(createElement(HeroVideo, {
    videoUrl: "https://example.com/hero.mp4",
    posterUrl: "https://example.com/custom-poster.webp",
  }));
  const empty = renderToStaticMarkup(createElement(HeroVideo, {
    videoUrl: "https://example.com/hero.mp4",
    posterUrl: null,
  }));
  const blank = renderToStaticMarkup(createElement(HeroVideo, {
    videoUrl: "https://example.com/hero.mp4",
    posterUrl: "   ",
  }));

  assert.match(custom, /https:\/\/example\.com\/custom-poster\.webp/);
  assert.match(empty, /hero-poster\.webp/);
  assert.match(blank, /hero-poster\.webp/);
});

test("homepage hero groups identity and Works action over a mobile bottom gradient", () => {
  const markup = renderToStaticMarkup(createElement(HeroVideo, { videoUrl: null }));

  assert.match(markup, /data-mobile-hero-primary="true"/);
  assert.match(markup, /bg-gradient-to-t/);
  assert.match(markup, /from-black\/85/);
  assert.doesNotMatch(markup, /top-\[40%\]/);
  assert.match(markup, /md:bottom-28/);
});

test("homepage works section links to the works index page", () => {
  const markup = renderToStaticMarkup(
    createElement(VideoGrid, { videos: [sampleVideo] })
  );

  assert.match(markup, /href="\/works"/);
  assert.match(markup, /ALL WORKS/);
});

test("portfolio menu enters Works from the homepage and other non-Works routes", () => {
  const expected = { id: "works", label: "WORKS", href: "/works", direction: "forward" };

  assert.deepEqual(getPortfolioMenuPrimary("/"), expected);
  assert.deepEqual(getPortfolioMenuPrimary("/news/example"), expected);
});

test("portfolio menu returns Home throughout the Works route tree", () => {
  const expected = { id: "home", label: "HOME", href: "/", direction: "back" };

  assert.deepEqual(getPortfolioMenuPrimary("/works"), expected);
  assert.deepEqual(getPortfolioMenuPrimary("/works/example"), expected);
});

test("navbar intro gating applies only to the homepage and works index", () => {
  assert.equal(shouldGateNavbarOnIntro("/"), true);
  assert.equal(shouldGateNavbarOnIntro("/works"), true);
  assert.equal(shouldGateNavbarOnIntro("/works/example"), false);
  assert.equal(shouldGateNavbarOnIntro("/news/example"), false);
  assert.equal(shouldGateNavbarOnIntro("/login"), false);
  assert.equal(shouldGateNavbarOnIntro("/dashboard"), false);
});

test("server notice shows only on the homepage", () => {
  assert.equal(shouldShowServerNotice("/"), true);
  assert.equal(shouldShowServerNotice("/works"), false);
  assert.equal(shouldShowServerNotice("/works/example"), false);
  assert.equal(shouldShowServerNotice("/news/example"), false);
});

test("homepage work cards carry a home return source without changing other work cards", () => {
  const homeMarkup = renderToStaticMarkup(createElement(VideoGrid, { videos: [sampleVideo] }));
  const otherMarkup = renderToStaticMarkup(createElement(VideoCard, { video: sampleVideo }));

  assert.match(homeMarkup, /href="\/works\/v1\?from=home"/);
  assert.match(otherMarkup, /href="\/works\/v1"/);
  assert.doesNotMatch(otherMarkup, /from=home/);
});

test("Dashboard navigation never uses the global black transition", () => {
  for (const [from, to] of [
    ["/dashboard/works", "/dashboard/news"],
    ["/dashboard/settings", "/"],
    ["/", "/dashboard/media"],
    ["/login", "/dashboard"],
    ["/dashboard", "/works"],
  ]) {
    assert.equal(shouldUseBlackTransition(from, to), false, `${from} → ${to}`);
  }
});

test("public page navigation still uses the existing black transition", () => {
  assert.equal(shouldUseBlackTransition("/works", "/news/example"), true);
  assert.equal(shouldUseBlackTransition("/", "/works"), true);
  assert.equal(shouldUseBlackTransition("/dashboard-preview", "/works"), true);
});

test("desktop nav marks Works throughout the Works route tree", () => {
  assert.equal(getActiveNavSection("/works", {}, 0, 800), "works");
  assert.equal(getActiveNavSection("/works/abc", {}, 0, 800), "works");
  assert.equal(getActiveNavSection("/news/abc", { works: 0 }, 5000, 800), null);
});

test("homepage nav follows the section crossing 40% of the viewport", () => {
  const tops = { works: 900, news: 2400, about: 3000 };
  assert.equal(getActiveNavSection("/", tops, 0, 1000), null);
  assert.equal(getActiveNavSection("/", tops, 600, 1000), "works");
  assert.equal(getActiveNavSection("/", tops, 2100, 1000), "news");
  assert.equal(getActiveNavSection("/", tops, 2700, 1000), "about");
});

test("homepage nav tolerates missing sections", () => {
  assert.equal(getActiveNavSection("/", { works: 900, about: 3000 }, 2100, 1000), "works");
  assert.equal(getActiveNavSection("/", {}, 2100, 1000), null);
});

test("scroll progress is clamped and safe on short pages", () => {
  assert.equal(getScrollProgress(0, 2000, 1000), 0);
  assert.equal(getScrollProgress(500, 2000, 1000), 0.5);
  assert.equal(getScrollProgress(1500, 2000, 1000), 1);
  assert.equal(getScrollProgress(-20, 2000, 1000), 0);
  assert.equal(getScrollProgress(0, 800, 1000), 0);
});

test("scroll progress line only shows on the homepage and works index", () => {
  assert.equal(shouldShowScrollProgress("/"), true);
  assert.equal(shouldShowScrollProgress("/works"), true);
  assert.equal(shouldShowScrollProgress("/works/abc"), false);
  assert.equal(shouldShowScrollProgress("/news/abc"), false);
  assert.equal(shouldShowScrollProgress("/dashboard"), false);
});

test("navbar uses inline desktop links and keeps the mobile menu", () => {
  const source = readFileSync(new URL("../components/navbar.tsx", import.meta.url), "utf8");
  assert.match(source, /hidden items-center gap-10 md:flex/);
  assert.match(source, /md:hidden/);
  assert.match(source, /getActiveNavSection/);
  assert.match(source, /getScrollProgress/);
  assert.match(source, /shouldShowScrollProgress/);
  assert.match(source, /aria-current/);
  assert.match(source, /motion-reduce:transition-none/);
  // 桌面右侧抽屉与遮罩已移除
  assert.doesNotMatch(source, /w-1\/4 min-w-\[320px\]/);
});

test("homepage nav marks the last section once the page bottom is reached", () => {
  const tops = { works: 900, news: 2400, about: 3000 };
  // 视口较高时 about 上沿到不了 40% 线，但滚到底时应高亮 ABOUT
  assert.equal(getActiveNavSection("/", tops, 2400, 1100, 3500), "about");
  assert.equal(getActiveNavSection("/", tops, 2300, 1100, 3500), "news");
  assert.equal(getActiveNavSection("/", { works: 900, news: 2400 }, 2400, 1100, 3500), "news");
  // 页面比视口还短时不算「到底」，仍停在 Hero
  assert.equal(getActiveNavSection("/", tops, 0, 1000, 900), null);
});
