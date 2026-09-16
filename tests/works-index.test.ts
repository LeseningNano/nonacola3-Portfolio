import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SelectedWorkCard } from "../components/works-index/selected-work-card";
import { WorkArchive } from "../components/works-index/work-archive";
import { ShowreelFeature } from "../components/works-index/showreel-feature";
import { WorksLanguageProvider } from "../components/works-index/works-language-provider";
import { WorksPageCopy } from "../components/works-index/works-page-copy";
import type { VideoRow } from "../lib/types";
import {
  DEFAULT_WORKS_LOCALE,
  WORKS_COPY,
  getWorksCopy,
  isWorksLocale,
} from "../lib/works-copy";
import {
  WORKS_HEADLINE,
  createFilmography,
  createThumbnailProxyPath,
  createThumbnailProxyResponse,
  groupWorksByYear,
  getSelectedWorkOrientation,
  getWorksHeadlineTokens,
  isAllowedThumbnailSource,
  normalizeShowreelType,
  selectFeaturedWorks,
} from "../lib/works-index";

test("keeps the approved works headline and highlights only recruiter keywords", () => {
  const tokens = getWorksHeadlineTokens();
  assert.equal(tokens.map((token) => token.text).join(" "), WORKS_HEADLINE);
  assert.equal(
    tokens.filter((token) => token.highlighted).map((token) => token.text).join("|"),
    "Motion|Designer|PV,|game|promotional|visuals|cinematic|motion|graphics."
  );
});

test("works locale defaults to English and rejects untrusted stored values", () => {
  assert.equal(DEFAULT_WORKS_LOCALE, "en");
  assert.equal(isWorksLocale("en"), true);
  assert.equal(isWorksLocale("zh-CN"), true);
  assert.equal(isWorksLocale("zh"), false);
  assert.equal(isWorksLocale("<script>"), false);
  assert.equal(isWorksLocale(null), false);
});

test("works dictionaries expose the same complete fixed-copy contract", () => {
  assert.deepEqual(Object.keys(WORKS_COPY.en), Object.keys(WORKS_COPY["zh-CN"]));
  assert.equal(getWorksCopy("en").selected.heading, "Selected Works");
  assert.equal(getWorksCopy("zh-CN").selected.heading, "精选作品");
  assert.equal(getWorksCopy("zh-CN").contact.heading, "期待与你合作。");
});

test("works localized headlines reconstruct the approved sentences", () => {
  assert.equal(
    WORKS_COPY.en.intro.headlineTokens.map(({ text }) => text).join(" "),
    "Motion Designer creating PV, game promotional visuals and cinematic motion graphics."
  );
  assert.equal(
    WORKS_COPY["zh-CN"].intro.headlineTokens.map(({ text }) => text).join(""),
    "动效设计师，专注于 PV、游戏宣传视觉与电影感动态图形。"
  );
});

test("works language provider persists only the scoped locale", () => {
  const source = readFileSync(
    new URL("../components/works-index/works-language-provider.tsx", import.meta.url),
    "utf8"
  );
  assert.match(source, /localStorage\.getItem\(WORKS_LOCALE_STORAGE_KEY\)/);
  assert.match(source, /isWorksLocale/);
  assert.match(source, /localStorage\.setItem\(WORKS_LOCALE_STORAGE_KEY/);
  assert.doesNotMatch(source, /document\.documentElement\.lang/);
});

test("selected work keeps authored project data while fixed labels default to English", () => {
  const authored = {
    ...work("localized-boundary", null, true),
    title: "原文标题",
    category: "自主制作",
    role: "Motion Design",
    tools: "After Effects · Blender",
    summary: "作者填写的摘要",
  };
  const markup = renderToStaticMarkup(
    createElement(SelectedWorkCard, { work: authored, index: 0 })
  );
  assert.match(markup, /原文标题/);
  assert.match(markup, /自主制作/);
  assert.match(markup, /作者填写的摘要/);
  assert.match(markup, /View Case Study/);
});

test("provider-scoped Chinese localizes fixed labels without touching authored content", () => {
  const authored = {
    ...work("zh-boundary", null, true),
    title: "原文标题",
    category: "自主制作",
    role: "Motion Design",
  };
  const markup = renderToStaticMarkup(
    createElement(
      WorksLanguageProvider,
      { initialLocale: "zh-CN" },
      createElement(SelectedWorkCard, { work: authored, index: 0 })
    )
  );
  assert.match(markup, /查看项目详情：原文标题/);
  assert.match(markup, /职责/);
  assert.match(markup, /Motion Design/);
  assert.match(markup, /lang="zh-CN"/);
});

test("works page copy localizes sections while archive data stays authored", () => {
  const groups = [{ label: "2026", works: [work("g1", "2026-01-01T00:00:00.000Z")] }];
  const props = { selected: [work("s1", null, true)], groups, email: "hi@example.com" };

  const en = renderToStaticMarkup(createElement(WorksPageCopy, props));
  assert.match(en, /Selected Works/);
  assert.match(en, /All Works/);
  assert.match(en, /work together/);
  assert.match(en, /s1/);

  const zh = renderToStaticMarkup(
    createElement(
      WorksLanguageProvider,
      { initialLocale: "zh-CN" },
      createElement(WorksPageCopy, props)
    )
  );
  assert.match(zh, /精选作品/);
  assert.match(zh, /全部作品/);
  assert.match(zh, /期待与你合作。/);
  assert.match(zh, /s1/);

  const emptyZh = renderToStaticMarkup(
    createElement(
      WorksLanguageProvider,
      { initialLocale: "zh-CN" },
      createElement(WorksPageCopy, { selected: [], groups: [], email: "hi@example.com" })
    )
  );
  assert.match(emptyZh, /作品正在更新中。/);
});

test("showreel localizes fixed strings while media behavior stays intact", () => {
  const props = { showreelUrl: "https://example.com/watch?v=abc", videoType: "url" as const };
  const en = renderToStaticMarkup(createElement(ShowreelFeature, props));
  assert.match(en, /SHOWREEL 2026/);
  assert.match(en, /Play Showreel 2026/);

  const zh = renderToStaticMarkup(
    createElement(
      WorksLanguageProvider,
      { initialLocale: "zh-CN" },
      createElement(ShowreelFeature, props)
    )
  );
  assert.match(zh, /作品集锦 2026/);
  assert.match(zh, /播放 2026 作品集锦/);
});

test("works intro consumes the shared copy dictionary with locale-aware spacing", () => {
  const source = readFileSync(
    new URL("../components/works-index/works-intro.tsx", import.meta.url),
    "utf8"
  );
  assert.match(source, /copy\.intro\.headlineTokens/);
  assert.match(source, /copy\.intro\.eyebrow/);
  assert.doesNotMatch(source, /getWorksHeadlineTokens/);
  assert.match(source, /INTRO_TOTAL_MS/);
});

test("works page keeps static data loading and scopes the language provider", () => {
  const source = readFileSync(new URL("../app/works/page.tsx", import.meta.url), "utf8");
  assert.match(source, /dynamic = "force-static"/);
  assert.match(source, /revalidate = 300/);
  assert.match(source, /<WorksLanguageProvider>/);
  assert.match(source, /<WorksLanguageToggle/);
  assert.doesNotMatch(source, /cookies\(/);
  assert.doesNotMatch(source, /searchParams/);
});

test("language toggle stays hidden until the works intro completes", () => {
  const source = readFileSync(
    new URL("../components/works-index/works-language-toggle.tsx", import.meta.url),
    "utf8"
  );
  assert.match(source, /portfolio-intro-done/);
  assert.match(source, /opacity-0/);
  assert.match(source, /transition-opacity/);
});

test("switching locale fades localized copy without remounting DOM", () => {
  const fadeHook = readFileSync(
    new URL("../components/works-index/use-locale-fade.ts", import.meta.url),
    "utf8"
  );
  // WAAPI 原位动画，不做 DOM 重挂载（重挂载会在部分元素上残留旧节点）
  assert.match(fadeHook, /\.animate\(/);
  assert.match(fadeHook, /prefers-reduced-motion: reduce/);

  for (const file of ["works-intro.tsx", "works-page-copy.tsx", "showreel-feature.tsx"]) {
    const source = readFileSync(
      new URL(`../components/works-index/${file}`, import.meta.url),
      "utf8"
    );
    assert.match(source, /useLocaleFade\(\)/, `${file} drives the switch fade`);
    assert.doesNotMatch(source, /key=\{locale\}/, `${file} must not remount on toggle`);
  }
});

test("localized headline uses locale-appropriate CJK metrics", () => {
  const source = readFileSync(
    new URL("../components/works-index/works-intro.tsx", import.meta.url),
    "utf8"
  );
  // 英文保留原有负字距与紧行高；中文使用自然字距与放宽的行高
  assert.match(source, /tracking-\[-0\.035em\]/);
  assert.match(source, /leading-\[1\.05\]/);
  assert.match(source, /tracking-\[0\.01em\]/);
  assert.match(source, /leading-\[1\.18\]/);
  assert.match(source, /locale === "en"/);
});

test("alternates selected work media from left to right", () => {
  assert.equal(getSelectedWorkOrientation(0), "media-left");
  assert.equal(getSelectedWorkOrientation(1), "media-right");
  assert.equal(getSelectedWorkOrientation(2), "media-left");
});

test("renders selected work media in the large desktop track on either side", () => {
  const selectedWork = {
    ...work("selected", null, true),
    title: "Selected Project",
    thumbnail: "https://kq4mwotlyfyzycmp.public.blob.vercel-storage.com/selected.jpg",
  };
  const mediaLeft = renderToStaticMarkup(
    createElement(SelectedWorkCard, { work: selectedWork, index: 0 })
  );
  const mediaRight = renderToStaticMarkup(
    createElement(SelectedWorkCard, { work: selectedWork, index: 1 })
  );

  assert.match(
    mediaLeft,
    /md:grid-cols-\[minmax\(0,1\.55fr\)_minmax\(16rem,0\.85fr\)\]/
  );
  assert.match(
    mediaRight,
    /md:grid-cols-\[minmax\(16rem,0\.85fr\)_minmax\(0,1\.55fr\)\]/
  );
});

test("keeps selected work media before details in mobile DOM order", () => {
  const selectedWork = {
    ...work("mobile-order", null, true),
    title: "Mobile Order Project",
  };

  for (const index of [0, 1]) {
    const markup = renderToStaticMarkup(
      createElement(SelectedWorkCard, { work: selectedWork, index })
    );
    assert.ok(markup.indexOf('data-vt-id="mobile-order"') < markup.indexOf("<h3"));
  }
});

test("numbers filmography entries continuously across year groups", () => {
  const groups = [
    { label: "2026", works: [work("one", null), work("two", null)] },
    { label: "2025", works: [work("three", null)] },
  ];
  assert.deepEqual(
    createFilmography(groups).map((group) => group.entries.map((entry) => entry.sequence)),
    [[1, 2], [3]]
  );
});

test("renders continuous ordered-list semantics without archive images", () => {
  const groups = [
    { label: "2026", works: [work("one", null), work("two", null)] },
    { label: "2025", works: [work("three", null)] },
  ];
  const markup = renderToStaticMarkup(createElement(WorkArchive, { groups }));

  assert.match(markup, /<ol start="1">/);
  assert.match(markup, /<ol start="3">/);
  assert.doesNotMatch(markup, /<img\b/);
});

function work(id: string, date: string | null, featured = false): VideoRow {
  return {
    id,
    title: id,
    description: null,
    summary: null,
    role: null,
    tools: null,
    category: "PV",
    embedUrl: "https://example.com/video",
    thumbnail: null,
    featured,
    order: 0,
    date,
  };
}

test("selected works preserves source order and has no hard cap", () => {
  const videos = [work("a", null, true), work("b", null), work("c", null, true), work("d", null, true), work("e", null, true)];
  assert.deepEqual(selectFeaturedWorks(videos).map(({ id }) => id), ["a", "c", "d", "e"]);
});

test("archive groups dated work newest-first and places undated work last", () => {
  const groups = groupWorksByYear([
    work("2025-a", "2025-03-01T00:00:00.000Z"),
    work("other", null),
    work("2026", "2026-01-01T00:00:00.000Z"),
    work("2025-b", "2025-01-01T00:00:00.000Z"),
  ]);
  assert.deepEqual(groups.map(({ label }) => label), ["2026", "2025", "Other"]);
  assert.deepEqual(groups[1].works.map(({ id }) => id), ["2025-a", "2025-b"]);
});

test("showreel type accepts upload and falls back to url", () => {
  assert.equal(normalizeShowreelType("upload"), "upload");
  assert.equal(normalizeShowreelType("url"), "url");
  assert.equal(normalizeShowreelType("unexpected"), "url");
  assert.equal(normalizeShowreelType(undefined), "url");
});

test("thumbnail proxy only accepts HTTPS Vercel Blob sources", () => {
  const source = "https://kq4mwotlyfyzycmp.public.blob.vercel-storage.com/uploads/work.jpg";

  assert.equal(isAllowedThumbnailSource(source), true);
  assert.equal(isAllowedThumbnailSource("http://kq4mwotlyfyzycmp.public.blob.vercel-storage.com/work.jpg"), false);
  assert.equal(isAllowedThumbnailSource("https://another.public.blob.vercel-storage.com/work.jpg"), false);
  assert.equal(isAllowedThumbnailSource("https://public.blob.vercel-storage.com.evil.test/work.jpg"), false);
  assert.equal(isAllowedThumbnailSource("https://user:pass@kq4mwotlyfyzycmp.public.blob.vercel-storage.com/work.jpg"), false);
  assert.equal(isAllowedThumbnailSource("https://127.0.0.1/work.jpg"), false);
  assert.equal(createThumbnailProxyPath(source), `/media/thumbnail?url=${encodeURIComponent(source)}`);
  assert.equal(createThumbnailProxyPath("https://example.com/work.jpg"), null);
});

test("thumbnail proxy returns cacheable same-origin image responses", async () => {
  const source = "https://kq4mwotlyfyzycmp.public.blob.vercel-storage.com/uploads/work.jpg";
  const fetcher: typeof fetch = async () =>
    new Response(new Uint8Array([1, 2, 3]), {
      headers: {
        "content-type": "image/jpeg",
        etag: '"work-v1"',
      },
    });

  const response = await createThumbnailProxyResponse(source, fetcher);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/jpeg");
  assert.equal(response.headers.get("etag"), '"work-v1"');
  assert.equal(response.headers.get("cache-control"), "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400");
  assert.equal(response.headers.get("pages-cache-control"), "public, s-maxage=2592000");
});

test("thumbnail proxy rejects untrusted sources before fetching", async () => {
  let called = false;
  const fetcher: typeof fetch = async () => {
    called = true;
    return new Response();
  };

  const response = await createThumbnailProxyResponse("https://127.0.0.1/private", fetcher);

  assert.equal(response.status, 400);
  assert.equal(called, false);
});
