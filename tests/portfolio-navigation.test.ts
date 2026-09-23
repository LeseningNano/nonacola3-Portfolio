import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HeroVideo } from "../components/hero-video";
import { VideoGrid } from "../components/video-grid";
import {
  getPortfolioMenuPrimary,
  shouldGateNavbarOnIntro,
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
