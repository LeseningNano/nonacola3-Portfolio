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

test("footer keeps social links by default for pages without an about section", () => {
  const markup = renderToStaticMarkup(createElement(Footer));
  assert.match(markup, /Bilibili/);
});

test("homepage footer can drop the social links already listed in about", () => {
  const markup = renderToStaticMarkup(createElement(Footer, { showSocial: false }));
  assert.ok(!markup.includes("Bilibili"));
  assert.match(markup, /BACK TO TOP/);
});

test("about bio is vertically centred against the avatar on desktop", () => {
  const markup = renderToStaticMarkup(createElement(AboutSection));
  assert.match(markup, /class="flex flex-1 flex-col gap-6 md:flex-row md:items-center md:gap-8"/);
});
