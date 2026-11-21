import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_URL,
  buildNewsMetadata,
  buildWorkMetadata,
  resolveShareImage,
} from "../lib/metadata";
import robots from "../app/robots";
import NotFound from "../app/not-found";

test("resolveShareImage proxies managed Blob thumbnails and falls back to default hero poster", () => {
  const blobUrl = "https://kq4mwotlyfyzycmp.public.blob.vercel-storage.com/thumb.webp";
  assert.equal(
    resolveShareImage(blobUrl),
    `/media/thumbnail?url=${encodeURIComponent(blobUrl)}`
  );
  assert.equal(resolveShareImage("https://i0.hdslb.com/cover.jpg"), "https://i0.hdslb.com/cover.jpg");
  assert.equal(resolveShareImage(null), DEFAULT_OG_IMAGE);
  assert.equal(resolveShareImage("   "), DEFAULT_OG_IMAGE);
});

test("buildWorkMetadata prefers summary, strips markdown from description, and includes OG/Twitter images", () => {
  const withSummary = buildWorkMetadata({
    id: "work-1",
    title: "Demo PV",
    summary: "Short pitch summary",
    description: "# Heading\n\n**Bold** details",
    thumbnail: "https://kq4mwotlyfyzycmp.public.blob.vercel-storage.com/cover.webp",
  });

  assert.equal(withSummary.title, "Demo PV");
  assert.equal(withSummary.description, "Short pitch summary");
  assert.deepEqual(withSummary.openGraph, {
    title: "Demo PV",
    description: "Short pitch summary",
    type: "website",
    url: "/works/work-1",
    siteName: SITE_NAME,
    locale: "zh_CN",
    images: [
      {
        url: `/media/thumbnail?url=${encodeURIComponent(
          "https://kq4mwotlyfyzycmp.public.blob.vercel-storage.com/cover.webp"
        )}`,
        alt: "Demo PV",
      },
    ],
  });
  assert.deepEqual(withSummary.twitter, {
    card: "summary_large_image",
    title: "Demo PV",
    description: "Short pitch summary",
    images: [
      `/media/thumbnail?url=${encodeURIComponent(
        "https://kq4mwotlyfyzycmp.public.blob.vercel-storage.com/cover.webp"
      )}`,
    ],
  });

  const fromMarkdown = buildWorkMetadata({
    id: "work-2",
    title: "Markdown Work",
    summary: null,
    description: "## Credits\n\nMade with **After Effects** and ![img](https://example.com/a.png).",
    thumbnail: null,
  });

  assert.equal(fromMarkdown.description, "Credits Made with After Effects and .");
  assert.deepEqual(fromMarkdown.twitter?.images, [DEFAULT_OG_IMAGE]);
});

test("buildNewsMetadata extracts plain-text excerpt and sets article Open Graph fields", () => {
  const meta = buildNewsMetadata({
    id: "post-1",
    title: "网站改进",
    body: "## 更新日志\n\n本次优化了**分享卡片**与 404 页面。",
    createdAt: "2026-10-08T12:00:00.000Z",
  });

  assert.equal(meta.title, "网站改进");
  assert.equal(meta.description, "更新日志 本次优化了分享卡片与 404 页面。");
  assert.deepEqual(meta.openGraph, {
    title: "网站改进",
    description: "更新日志 本次优化了分享卡片与 404 页面。",
    type: "article",
    url: "/news/post-1",
    siteName: SITE_NAME,
    locale: "zh_CN",
    publishedTime: "2026-10-08T12:00:00.000Z",
    images: [{ url: DEFAULT_OG_IMAGE, alt: "网站改进" }],
  });
  assert.deepEqual(meta.twitter, {
    card: "summary_large_image",
    title: "网站改进",
    description: "更新日志 本次优化了分享卡片与 404 页面。",
    images: [DEFAULT_OG_IMAGE],
  });

  const emptyBody = buildNewsMetadata({
    id: "post-2",
    title: "Empty",
    body: "```ts\nconst x = 1;\n```",
    createdAt: new Date("2026-10-08T00:00:00.000Z"),
  });
  assert.equal(emptyBody.description, DEFAULT_DESCRIPTION);
});

test("robots exposes sitemap URL and NotFound renders dark 404 navigation links", () => {
  const config = robots();
  assert.equal(config.sitemap, `${SITE_URL}/sitemap.xml`);

  const html = renderToStaticMarkup(NotFound());
  assert.match(html, /404\./);
  assert.match(html, /href="\/"/);
  assert.match(html, /href="\/works"/);
});
