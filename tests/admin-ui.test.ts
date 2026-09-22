import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AdminStatusBadge } from "../components/admin/admin-status-badge";
import { ADMIN_NAV_GROUPS } from "../lib/admin-navigation";

test("admin navigation groups content, page media, and library by responsibility", () => {
  assert.deepEqual(
    ADMIN_NAV_GROUPS.map((group) => [group.label, group.items.map((item) => item.label)]),
    [["内容", ["作品", "News"]], ["网站", ["页面媒体"]], ["资源", ["媒体库"]]],
  );
});

test("ordinary and featured states share the same badge structure", () => {
  const ordinary = renderToStaticMarkup(createElement(AdminStatusBadge, { tone: "neutral" }, "普通"));
  const featured = renderToStaticMarkup(createElement(AdminStatusBadge, { tone: "featured" }, "精选"));
  assert.match(ordinary, /data-admin-status="neutral"/);
  assert.match(featured, /data-admin-status="featured"/);
  assert.match(ordinary, /rounded-full/);
  assert.match(featured, /rounded-full/);
});

test("admin editors retain visible focus and mobile sticky offsets", () => {
  const header = readFileSync(new URL("../components/admin/admin-editor-header.tsx", import.meta.url), "utf8");
  const menu = readFileSync(new URL("../components/ui/menu.tsx", import.meta.url), "utf8");

  assert.match(header, /top-14/);
  assert.match(header, /md:top-0/);
  assert.match(menu, /focus:/);
  assert.match(menu, /outline-none/);
});

test("Dashboard shell has no global command/search bar and list identities can wrap or truncate", () => {
  const shell = readFileSync(new URL("../components/admin/admin-shell.tsx", import.meta.url), "utf8");
  const works = readFileSync(new URL("../components/admin/works-list.tsx", import.meta.url), "utf8");
  const news = readFileSync(new URL("../components/admin/news-list.tsx", import.meta.url), "utf8");
  const media = readFileSync(new URL("../components/admin/media-library.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(shell, /CommandPalette|command palette|globalSearch|面包屑|全局搜索/i);
  for (const source of [works, news, media]) {
    assert.match(source, /min-w-0/);
    assert.match(source, /truncate|break-words/);
  }
});

test("every dirty editor protects both client history and browser unload", () => {
  const editorPaths = [
    "../components/admin/work-order-editor.tsx",
    "../components/admin/work-editor.tsx",
    "../components/admin/short-post-editor.tsx",
    "../components/admin/article-editor.tsx",
    "../components/admin/page-settings.tsx",
  ];

  for (const path of editorPaths) {
    const source = readFileSync(new URL(path, import.meta.url), "utf8");
    assert.match(source, /useAdminNavigationGuard\(confirmNavigation,\s*isDirty\)/, path);
  }

  const shell = readFileSync(new URL("../components/admin/admin-shell.tsx", import.meta.url), "utf8");
  assert.match(shell, /installUnsavedAdminHistoryGuard/);
  assert.match(shell, /addEventListener\("beforeunload"/);
});
