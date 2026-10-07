import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Footer } from "../components/footer";
import { AboutSection } from "../components/about-section";

test("footer offers a back-to-top button and no build credits", () => {
  const markup = renderToStaticMarkup(createElement(Footer));

  assert.match(markup, /<button[^>]*type="button"[^>]*>BACK TO TOP/);
  assert.ok(!markup.includes("Built with"));
  assert.ok(!markup.includes("Vercel"));
  assert.match(markup, /nonacola3\. All rights reserved\./);
});

test("footer never repeats social links; each page lists them in its own contact area", () => {
  for (const width of ["home", "works"] as const) {
    const markup = renderToStaticMarkup(createElement(Footer, { width }));
    assert.ok(!markup.includes("Bilibili"), width);
    assert.match(markup, /BACK TO TOP/);
  }
});

test("footer width follows the page it sits on", () => {
  const home = renderToStaticMarkup(createElement(Footer));
  assert.match(home, /class="page-cap /);

  // /works 正文：mx-auto max-w-[1200px] px-5 sm:px-8 md:px-12
  const works = renderToStaticMarkup(createElement(Footer, { width: "works" }));
  assert.match(works, /mx-auto max-w-\[1200px\] px-5 sm:px-8 md:px-12/);
  assert.ok(!works.includes("page-cap"));
});

test("about bio is vertically centred against the avatar on desktop", () => {
  const markup = renderToStaticMarkup(createElement(AboutSection));
  assert.match(markup, /class="flex flex-1 flex-col gap-6 md:flex-row md:items-center md:gap-8"/);
});

test("about contact column is vertically centred and sized up on desktop", () => {
  const markup = renderToStaticMarkup(createElement(AboutSection));
  assert.match(markup, /class="mt-10 flex flex-col md:flex-row md:items-center gap-10 md:gap-16"/);
  assert.match(markup, /class="text-xl md:text-2xl[^"]*"[^>]*>[^<]*@/);
  assert.match(markup, /class="px-5 py-2\.5 [^"]*text-sm md:text-base"[^>]*>Bilibili/);
});

test("about bio uses the new copy, one sentence group per line", () => {
  const markup = renderToStaticMarkup(createElement(AboutSection));
  assert.match(
    markup,
    /我是nonacola3，曾用名ナノナ。<br\/>进厂打工，业余玩AE，还在努力进步中。<br\/>想把脑海里的画面做成炫酷好看的作品，用它们讲故事。欢迎志同道合的朋友来聊。/
  );
  assert.ok(!markup.includes("业余PV师"));
});
