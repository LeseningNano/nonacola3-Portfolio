import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HeroVideo } from "../components/hero-video";
import { VideoGrid } from "../components/video-grid";
import { getPortfolioMenuPrimary } from "../lib/portfolio-navigation";
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

test("homepage hero centers the title block on mobile and keeps the desktop anchor", () => {
  const markup = renderToStaticMarkup(createElement(HeroVideo, { videoUrl: null }));

  assert.match(markup, /top-\[40%\]/);
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
