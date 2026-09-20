import assert from "node:assert/strict";
import test from "node:test";
import {
  ADMIN_NAV_ITEMS,
  getActiveAdminItem,
  isAdminPath,
} from "../lib/admin-navigation";
import { filterAdminWorks, serializeAdminWork } from "../lib/admin-works";
import type { Video } from "../lib/types";

function adminWork(
  id: string,
  title: string,
  category: string,
  featured: boolean,
): Video {
  return {
    id,
    title,
    description: null,
    summary: null,
    role: null,
    tools: null,
    category,
    embedUrl: "https://example.com",
    thumbnail: null,
    featured,
    order: 0,
    date: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-03T00:00:00.000Z",
  };
}

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

test("admin works serialization emits ISO dates without mutating nullable fields", () => {
  const serialized = serializeAdminWork({
    id: "one",
    title: "Work",
    description: null,
    summary: null,
    role: null,
    tools: null,
    category: "PV",
    embedUrl: "https://example.com",
    thumbnail: null,
    featured: true,
    order: 0,
    date: new Date("2026-01-02T00:00:00.000Z"),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-03T00:00:00.000Z"),
  });

  assert.equal(serialized.date, "2026-01-02T00:00:00.000Z");
  assert.equal(serialized.updatedAt, "2026-01-03T00:00:00.000Z");
  assert.equal(serialized.summary, null);
});

test("admin work filtering searches title and category and can limit featured works", () => {
  const works = [
    adminWork("a", "Numb Numb", "PV", true),
    adminWork("b", "BLEAP", "Motion", false),
  ];

  assert.deepEqual(filterAdminWorks(works, "numb", false).map(({ id }) => id), ["a"]);
  assert.deepEqual(filterAdminWorks(works, "motion", false).map(({ id }) => id), ["b"]);
  assert.deepEqual(filterAdminWorks(works, "", true).map(({ id }) => id), ["a"]);
});
