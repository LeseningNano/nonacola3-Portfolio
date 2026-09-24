import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { WorkReturnLinkView } from "../components/work-return-link";

test("a work opened from the homepage offers a return to the homepage", () => {
  const markup = renderToStaticMarkup(createElement(WorkReturnLinkView, { from: "home" }));

  assert.match(markup, /href="\/"/);
  assert.match(markup, /返回主页/);
  assert.doesNotMatch(markup, /返回作品列表/);
});

test("direct and unrecognized work URLs return to the Works index", () => {
  for (const from of [null, "works", "https://example.com", "/dashboard"]) {
    const markup = renderToStaticMarkup(createElement(WorkReturnLinkView, { from }));

    assert.match(markup, /href="\/works"/);
    assert.match(markup, /返回作品列表/);
    assert.doesNotMatch(markup, /href="https:\/\//);
  }
});
