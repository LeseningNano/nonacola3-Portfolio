import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Reveal, shouldSkipRevealMotion } from "../components/viewport-reveal";
import { VideoGrid } from "../components/video-grid";
import { NewsSection } from "../components/news-section";
import { AboutSection } from "../components/about-section";
import type { VideoRow, PostItem } from "../lib/types";

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

const samplePost: PostItem = {
  id: "p1",
  title: "A post",
  body: "Body",
  tag: null,
  published: true,
  createdAt: new Date("2026-01-01").toISOString(),
};

test("SSR markup keeps reveal content visible without JavaScript", () => {
  const heading = renderToStaticMarkup(
    createElement(Reveal, { variant: "heading" }, "works.")
  );
  const content = renderToStaticMarkup(
    createElement(Reveal, { variant: "content" }, "精选视频作品与创作项目")
  );

  for (const markup of [heading, content]) {
    // 隐藏态只能由浏览器端 effect 添加；SSR 输出不能包含任何隐藏状态
    assert.ok(!markup.includes("data-reveal-pending"), `no pending state: ${markup}`);
    assert.ok(!/opacity:\s*0/.test(markup), `no inline opacity 0: ${markup}`);
  }

  assert.match(heading, /works\./);
  assert.match(content, /精选视频作品与创作项目/);
});

test("heading variant exposes the mask inner element for the CSS reveal", () => {
  const markup = renderToStaticMarkup(
    createElement(Reveal, { variant: "heading" }, "works.")
  );

  assert.match(markup, /data-reveal="heading"/);
  assert.match(markup, /reveal-inner/);
});

test("content variant carries the variant marker for CSS transitions", () => {
  const markup = renderToStaticMarkup(
    createElement(Reveal, { variant: "content", delay: 180 }, "正文")
  );

  assert.match(markup, /data-reveal="content"/);
  assert.match(markup, /--reveal-delay:180ms/);
});

test("reduced motion skips the reveal animation entirely", () => {
  assert.equal(shouldSkipRevealMotion(true), true);
  assert.equal(shouldSkipRevealMotion(false), false);
});

test("works section stages the title reveal before staggered content", () => {
  const markup = renderToStaticMarkup(
    createElement(VideoGrid, { videos: [sampleVideo] })
  );

  assert.match(markup, /data-reveal="heading"/);
  assert.match(markup, /data-reveal="content"/);
  // 错峰：内容相对标题的延迟存在
  assert.match(markup, /--reveal-delay:(1[5-9]\d|[2-9]\d\d)ms/);
  // 无 JS 安全：SSR 不带隐藏态
  assert.ok(!markup.includes("data-reveal-pending"));
  // 现有结构与文案不受影响
  assert.match(markup, /ALL WORKS/);
  assert.match(markup, /href="\/works"/);
  assert.match(markup, /works\./);
});

test("news section stages title and content the same way", () => {
  const markup = renderToStaticMarkup(
    createElement(NewsSection, { posts: [samplePost] })
  );

  assert.match(markup, /data-reveal="heading"/);
  assert.match(markup, /data-reveal="content"/);
  assert.ok(!markup.includes("data-reveal-pending"));
  assert.match(markup, /news\./);
  assert.match(markup, /最新动态/);
});

test("about section stages title and content the same way", () => {
  const markup = renderToStaticMarkup(createElement(AboutSection));

  assert.match(markup, /data-reveal="heading"/);
  assert.match(markup, /data-reveal="content"/);
  assert.ok(!markup.includes("data-reveal-pending"));
  assert.match(markup, /about\./);
});

test("homepage sections get a non-blocking dim transition layer", () => {
  const works = renderToStaticMarkup(createElement(VideoGrid, { videos: [sampleVideo] }));
  const news = renderToStaticMarkup(createElement(NewsSection, { posts: [samplePost] }));
  const about = renderToStaticMarkup(createElement(AboutSection));

  for (const [name, markup] of [["works", works], ["news", news], ["about", about]] as const) {
    assert.ok(markup.includes('data-reveal="dim"'), `${name} has the dim layer`);
    assert.ok(markup.includes("pointer-events-none"), `${name} dim layer never blocks input`);
    assert.ok(markup.includes("hidden"), `${name} dim layer hidden by default`);
    assert.ok(markup.includes("md:block"), `${name} dim layer is desktop only`);
    assert.ok(markup.includes("aria-hidden"), `${name} dim layer is decorative`);
  }

  // 遮光层需要区块作为定位上下文
  assert.match(works, /section id="works" class="relative/);
  assert.match(news, /section id="news" class="relative/);
  assert.match(about, /section id="about" class="relative/);
});
