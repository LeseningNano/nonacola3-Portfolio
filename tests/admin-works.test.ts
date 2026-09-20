import assert from "node:assert/strict";
import test from "node:test";
import {
  ADMIN_NAV_ITEMS,
  getActiveAdminItem,
  isAdminPath,
} from "../lib/admin-navigation";

test("administrator route detection includes dashboard and legacy video editors only", () => {
  assert.equal(isAdminPath("/dashboard"), true);
  assert.equal(isAdminPath("/dashboard/works/example/edit"), true);
  assert.equal(isAdminPath("/videos/new"), true);
  assert.equal(isAdminPath("/videos/example/edit"), true);
  assert.equal(isAdminPath("/works/example"), false);
  assert.equal(isAdminPath("/news/example"), false);
  assert.equal(isAdminPath("/login"), false);
});

test("administrator navigation resolves nested modules", () => {
  assert.deepEqual(ADMIN_NAV_ITEMS.map(({ id }) => id), ["works", "news", "settings", "media"]);
  assert.equal(getActiveAdminItem("/dashboard/works/order"), "works");
  assert.equal(getActiveAdminItem("/dashboard/news/example/edit"), "news");
  assert.equal(getActiveAdminItem("/dashboard/settings"), "settings");
  assert.equal(getActiveAdminItem("/dashboard/media"), "media");
  assert.equal(getActiveAdminItem("/login"), null);
});
