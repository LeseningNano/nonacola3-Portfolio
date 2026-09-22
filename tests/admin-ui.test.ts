import assert from "node:assert/strict";
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
