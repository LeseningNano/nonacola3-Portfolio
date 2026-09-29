import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  createSaveableSettingState,
  isSaveableSettingDirty,
  reduceSaveableSettingState,
} from "../lib/admin-settings";
import { createHeroPosterUpdate, resolveHeroMedia } from "../lib/hero";
import { heroMutateSchema } from "../lib/schemas";

test("Hero media falls back to the bundled poster", () => {
  assert.deepEqual(resolveHeroMedia({ blobUrl: "https://example.com/hero.mp4", posterUrl: null }), {
    blobUrl: "https://example.com/hero.mp4",
    posterUrl: "/hero-poster.webp",
  });
  assert.equal(resolveHeroMedia({ blobUrl: "hero.mp4", posterUrl: "   " })?.posterUrl, "/hero-poster.webp");
  assert.equal(resolveHeroMedia(null), null);
});

test("Hero mutation allows poster changes while preserving legacy omissions", () => {
  assert.equal(heroMutateSchema.safeParse({ blobUrl: "https://example.com/hero.mp4" }).success, true);
  assert.equal(heroMutateSchema.safeParse({ blobUrl: "https://example.com/hero.mp4", posterUrl: "https://example.com/poster.webp" }).success, true);
  assert.deepEqual(createHeroPosterUpdate(undefined), {});
  assert.deepEqual(createHeroPosterUpdate("   "), { posterUrl: null });
});

test("page settings reuse the shared media field for Hero and uploaded Showreel", () => {
  const source = readFileSync(new URL("../components/admin/page-settings.tsx", import.meta.url), "utf8");
  const route = readFileSync(new URL("../app/(admin)/dashboard/settings/page.tsx", import.meta.url), "utf8");

  assert.match(source, /MediaField/);
  assert.match(source, /kind="video"/);
  assert.match(source, /accept="video\/mp4"/);
  assert.match(source, /kind="image"/);
  assert.match(source, /封面图片/);
  assert.match(source, /页面媒体/);
  assert.match(source, /PAGE MEDIA/);
  assert.match(source, /revert-field/);
  assert.match(source, /待保存/);
  assert.match(source, /默认封面/);
  assert.doesNotMatch(source, /SourceDetails/);
  assert.match(source, /posterUrl/);
  assert.match(source, /value: \{ \.\.\.heroState\.draft, \.\.\.value \}/);
  assert.match(source, /\/api\/hero/);
  assert.match(source, /blobUrl: heroState\.draft\.videoUrl/);
  assert.match(source, /posterUrl: heroState\.draft\.posterUrl/);
  assert.match(source, /\/api\/showreel/);
  assert.match(source, /useAdminNavigationGuard\(confirmNavigation,\s*isDirty\)/);
  assert.match(source, /isSaveableSettingDirty\(heroState\)\s*\|\|\s*isSaveableSettingDirty\(showreelState\)/);
  assert.doesNotMatch(source, /@vercel\/blob\/client/);
  assert.match(route, /posterUrl/);
  assert.match(route, /DEFAULT_HERO_POSTER_URL/);
});

test("failed Hero save retains both video and poster drafts", () => {
  const initial = createSaveableSettingState({ videoUrl: "old.mp4", posterUrl: "old.webp" });
  const changed = reduceSaveableSettingState(initial, {
    type: "change",
    value: { videoUrl: "new.mp4", posterUrl: "new.webp" },
  });
  const failed = reduceSaveableSettingState(reduceSaveableSettingState(changed, { type: "save-start" }), {
    type: "save-error",
    message: "network",
  });

  assert.deepEqual(failed.draft, { videoUrl: "new.mp4", posterUrl: "new.webp" });
  assert.deepEqual(failed.saved, { videoUrl: "old.mp4", posterUrl: "old.webp" });
  assert.equal(isSaveableSettingDirty(failed), true);
  assert.equal(isSaveableSettingDirty(reduceSaveableSettingState(failed, { type: "save-success" })), false);
});

test("failed settings save preserves the selected draft value", () => {
  const initial = createSaveableSettingState("saved.mp4");
  const dirty = reduceSaveableSettingState(initial, { type: "change", value: "selected.mp4" });
  const saving = reduceSaveableSettingState(dirty, { type: "save-start" });
  const failed = reduceSaveableSettingState(saving, { type: "save-error", message: "保存失败" });

  assert.equal(failed.saved, "saved.mp4");
  assert.equal(failed.draft, "selected.mp4");
  assert.equal(failed.status, "error");
});

test("successful settings save adopts the current draft as saved", () => {
  const initial = createSaveableSettingState("saved.mp4");
  const dirty = reduceSaveableSettingState(initial, { type: "change", value: "selected.mp4" });
  const saved = reduceSaveableSettingState(dirty, { type: "save-success" });

  assert.equal(saved.saved, "selected.mp4");
  assert.equal(saved.draft, "selected.mp4");
  assert.equal(saved.status, "saved");
});

test("reverting one slot restores only that field and returns to clean when nothing else changed", () => {
  const initial = createSaveableSettingState({ videoUrl: "old.mp4", posterUrl: "old.webp" });
  const both = reduceSaveableSettingState(initial, { type: "change", value: { videoUrl: "new.mp4", posterUrl: "new.webp" } });
  const posterReverted = reduceSaveableSettingState(both, { type: "revert-field", field: "posterUrl" });
  assert.deepEqual(posterReverted.draft, { videoUrl: "new.mp4", posterUrl: "old.webp" });
  assert.equal(posterReverted.status, "dirty");
  const allReverted = reduceSaveableSettingState(posterReverted, { type: "revert-field", field: "videoUrl" });
  assert.deepEqual(allReverted.draft, allReverted.saved);
  assert.equal(allReverted.status, "clean");
});

test("choosing the saved value again is not a pending change", () => {
  const initial = createSaveableSettingState({ videoUrl: "old.mp4", posterUrl: "old.webp" });
  const changed = reduceSaveableSettingState(initial, { type: "change", value: { videoUrl: "new.mp4", posterUrl: "old.webp" } });
  const back = reduceSaveableSettingState(changed, { type: "change", value: { videoUrl: "old.mp4", posterUrl: "old.webp" } });
  assert.equal(back.status, "clean");
  assert.equal(isSaveableSettingDirty(back), false);
});

test("revert is ignored while saving", () => {
  const saving = reduceSaveableSettingState(
    reduceSaveableSettingState(createSaveableSettingState({ videoUrl: "a", posterUrl: "b" }), { type: "change", value: { videoUrl: "c", posterUrl: "b" } }),
    { type: "save-start" },
  );
  assert.equal(reduceSaveableSettingState(saving, { type: "revert-field", field: "videoUrl" }), saving);
});
