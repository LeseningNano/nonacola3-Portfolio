import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildNewsTimeline, HOME_NEWS_LIMIT } from "../lib/news-timeline";
import { NewsSection } from "../components/news-section";
import type { PostItem } from "../lib/types";

const post = (id: string, iso: string, title: string | null, body = "正文第一句。第二句。", tag: string | null = "公告"): PostItem => ({
  id,
  title,
  body,
  tag,
  published: true,
  createdAt: new Date(iso).toISOString(),
});

const posts = [
  post("a", "2027-01-03T12:00:00+08:00", "新年第一篇", "## 你好\n\n**新年**快乐，详见[这里](https://e.com)。"),
  post("b", "2026-10-07T12:00:00+08:00", "网站改进"),
  post("c", "2026-08-06T12:00:00+08:00", "在Miracool2026 LIVE有新作品展出！！"),
  post("d", "2026-07-23T12:00:00+08:00", null, "网站进入试运营阶段，可能有未预料的错误出现。", "日常"),
  post("e", "2026-07-20T12:00:00+08:00", "【重要】关于网站访问速度缓慢"),
];

test("homepage timeline shows at most four entries", () => {
  assert.equal(HOME_NEWS_LIMIT, 4);
  assert.deepEqual(buildNewsTimeline(posts).map((entry) => entry.id), ["a", "b", "c", "d"]);
});

test("year labels appear on the first entry and wherever the year changes", () => {
  const entries = buildNewsTimeline(posts);
  assert.deepEqual(entries.map((entry) => entry.year), ["2027", "2026", null, null]);
  assert.deepEqual(entries.map((entry) => entry.date), ["01.03", "10.07", "08.06", "07.23"]);
});

test("articles carry a plain-text excerpt; short posts show their body instead", () => {
  const [article, , , short] = buildNewsTimeline(posts);
  assert.equal(article.kind, "article");
  assert.equal(article.title, "新年第一篇");
  assert.equal(article.text, "你好 新年快乐，详见这里。");
  assert.equal(short.kind, "short");
  assert.equal(short.title, null);
  assert.equal(short.text, "网站进入试运营阶段，可能有未预料的错误出现。");
});

test("news section renders the timeline with links only for articles", () => {
  const markup = renderToStaticMarkup(createElement(NewsSection, { posts }));

  assert.match(markup, /data-news-timeline=""/);
  assert.equal(markup.match(/data-news-entry=""/g)?.length, 4);
  // 最新一条实心方点，其余空心
  assert.equal(markup.match(/data-news-dot="latest"/g)?.length, 1);
  assert.equal(markup.match(/data-news-dot="past"/g)?.length, 3);
  // 文章整块可点，短动态不是链接
  assert.match(markup, /<a(?=[^>]*href="\/news\/a")(?=[^>]*data-news-entry="")[^>]*>/);
  assert.doesNotMatch(markup, /href="\/news\/d"/);
  // 像素字日期与年份
  assert.match(markup, />01\.03</);
  assert.match(markup, />2027</);
  // 摘要最多两行
  assert.match(markup, /line-clamp-2[^"]*"[^>]*>你好 新年快乐/);
  // 沿用宽屏上限与整体淡入
  assert.match(markup, /class="page-cap/);
  assert.match(markup, /data-reveal="content"/);
  assert.ok(!markup.includes("data-reveal-pending"));
});

test("news section keeps its empty state", () => {
  const markup = renderToStaticMarkup(createElement(NewsSection, { posts: [] }));
  assert.match(markup, /暂无动态。/);
  assert.doesNotMatch(markup, /data-news-timeline/);
});
