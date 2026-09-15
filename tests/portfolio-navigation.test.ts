import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HeroVideo } from "../components/hero-video";
import { getPortfolioMenuPrimary } from "../lib/portfolio-navigation";

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
