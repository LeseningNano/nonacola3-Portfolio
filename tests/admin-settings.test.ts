import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  createSaveableSettingState,
  reduceSaveableSettingState,
} from "../lib/admin-settings";

test("page settings reuse the shared Media picker for Hero and uploaded Showreel", () => {
  const source = readFileSync(new URL("../components/admin/page-settings.tsx", import.meta.url), "utf8");

  assert.match(source, /MediaPicker/);
  assert.match(source, /kind="video"/);
  assert.match(source, /accept="video\/mp4"/);
  assert.match(source, /\/api\/hero/);
  assert.match(source, /\/api\/showreel/);
  assert.doesNotMatch(source, /@vercel\/blob\/client/);
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
