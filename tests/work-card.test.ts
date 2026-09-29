import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { WorkCard } from "../components/work-card";
import { Reveal } from "../components/viewport-reveal";
import { formatWorkMeta, getWorkYear } from "../lib/works-index";
import type { VideoRow } from "../lib/types";

const base: VideoRow = {
  id: "w1",
  title: "Night Drive",
  description: null,
  summary: null,
  role: null,
  tools: null,
  category: "PV",
  embedUrl: "",
  thumbnail: null,
  featured: false,
  order: 0,
  date: "2026-03-01T00:00:00.000Z",
};

test("work meta joins non-empty parts with a middle dot", () => {
  assert.equal(formatWorkMeta(["PV", "2026", null, "  ", undefined]), "PV · 2026");
  assert.equal(formatWorkMeta([]), "");
});

test("work year uses UTC and ignores missing or invalid dates", () => {
  assert.equal(getWorkYear("2026-01-01T00:00:00.000Z"), "2026");
  assert.equal(getWorkYear(null), null);
  assert.equal(getWorkYear("not a date"), null);
});

test("card renders the thumbnail first, then title, meta, details and summary", () => {
  const markup = renderToStaticMarkup(
    createElement(WorkCard, {
      work: base,
      href: "/works/w1?from=home",
      meta: "PV · 2026",
      details: "Role Motion Design",
      summary: "One line summary",
      sizes: "100vw",
    })
  );
  assert.match(markup, /href="\/works\/w1\?from=home"/);
  assert.match(markup, /data-vt-id="w1"/);
  assert.ok(markup.indexOf('data-vt-id="w1"') < markup.indexOf("<h3"));
  assert.match(markup, /Night Drive/);
  assert.match(markup, /PV · 2026/);
  assert.match(markup, /Role Motion Design/);
  assert.match(markup, /One line summary/);
});

test("card without a thumbnail shows a neutral play placeholder", () => {
  const markup = renderToStaticMarkup(
    createElement(WorkCard, { work: base, href: "/works/w1", meta: "", sizes: "100vw" })
  );
  assert.match(markup, /lucide-play/);
  assert.doesNotMatch(markup, /<img\b/);
});

test("blob thumbnails go through the same-origin proxy", () => {
  const markup = renderToStaticMarkup(
    createElement(WorkCard, {
      work: { ...base, thumbnail: "https://kq4mwotlyfyzycmp.public.blob.vercel-storage.com/a.jpg" },
      href: "/works/w1",
      meta: "",
      sizes: "100vw",
    })
  );
  assert.match(markup, /\/media\/thumbnail\?url=/);
});

test("hover effects only apply from md and respect reduced motion", () => {
  const markup = renderToStaticMarkup(
    createElement(WorkCard, { work: base, href: "/works/w1", meta: "", sizes: "100vw" })
  );
  assert.match(markup, /▶ PLAY/);
  assert.match(markup, /md:group-hover:opacity-0/);
  assert.match(markup, /md:group-hover:scale-x-100/);
  assert.match(markup, /motion-reduce:transition-none/);
  assert.doesNotMatch(markup, /(?<!md:)group-hover:/);
});

test("card reveal is SSR-visible and has a reduced-motion fallback", () => {
  const markup = renderToStaticMarkup(createElement(Reveal, { variant: "card", delay: 100 }, "card"));
  assert.match(markup, /data-reveal="card"/);
  assert.match(markup, /--reveal-delay:100ms/);
  assert.doesNotMatch(markup, /data-reveal-pending/);

  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  // IntersectionObserver 会把目标自身的 clip-path 算进可见面积：完全裁掉的目标永远不会「进入视口」。
  // 所以被观察的外层绝不能裁切，擦出效果只放在子元素上。
  const outer = css.match(/\[data-reveal-pending\]\[data-reveal="card"\] \{([^}]*)\}/);
  assert.ok(outer, "pending card rule exists");
  assert.doesNotMatch(outer[1], /clip-path/);
  assert.doesNotMatch(css, /\[data-reveal="card"\] \{[^}]*clip-path/);
  assert.match(css, /\[data-reveal-pending\]\[data-reveal="card"\] > \* \{[^}]*clip-path: inset\(100% 0 0 0\)/);
  assert.match(css, /\[data-reveal-pending\]\[data-reveal="card"\] > \* \{[^}]*clip-path: none !important/);
});
