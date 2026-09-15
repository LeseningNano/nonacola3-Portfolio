import assert from "node:assert/strict";
import test from "node:test";
import {
  attemptChunkRecovery,
  isChunkLoadError,
  shouldAutoReload,
} from "../lib/chunk-recovery";

test("detects Next.js chunk load failures from the deploy window", () => {
  assert.equal(
    isChunkLoadError(
      new Error(
        "Loading chunk 6695 failed. (error: https://www.nonacola3.com/_next/static/chunks/app/works/%5Bid%5D/page-ec75fd723009da7b.js)"
      )
    ),
    true
  );
  assert.equal(isChunkLoadError(new Error("Loading CSS chunk 12 failed. (css/foo.css)")), true);

  const named = new Error("boom");
  named.name = "ChunkLoadError";
  assert.equal(isChunkLoadError(named), true);

  assert.equal(
    isChunkLoadError(new Error("Failed to fetch dynamically imported module: /_next/a.js")),
    true
  );
});

test("ignores ordinary application errors", () => {
  assert.equal(isChunkLoadError(new Error("Cannot read properties of undefined")), false);
  assert.equal(isChunkLoadError(new Error("页面加载失败，请稍后重试。")), false);
  assert.equal(isChunkLoadError(null), false);
  assert.equal(isChunkLoadError(undefined), false);
  assert.equal(isChunkLoadError("string error"), false);
});

test("auto-reloads at most once per cooldown window to avoid a reload loop", () => {
  const cooldown = 10_000;
  const now = 1_000_000;

  // 从未尝试过（无记录）：允许
  assert.equal(shouldAutoReload(now, 0, cooldown), true);
  // 冷却窗口内：不再重载，转为展示错误 UI
  assert.equal(shouldAutoReload(now, now - 1, cooldown), false);
  assert.equal(shouldAutoReload(now, now - cooldown + 1, cooldown), false);
  // 冷却窗口已过：允许再次尝试
  assert.equal(shouldAutoReload(now, now - cooldown, cooldown), true);
});

test("records the attempt and refuses a second reload inside the cooldown", () => {
  const store = new Map<string, string>();
  let reloads = 0;
  const fakeWindow = {
    sessionStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    },
    location: { reload: () => void reloads++ },
  };
  const original = (globalThis as { window?: unknown }).window;
  (globalThis as { window?: unknown }).window = fakeWindow;

  try {
    const now = 1_000_000;
    assert.equal(attemptChunkRecovery(new Error("Loading chunk 6695 failed."), now), true);
    assert.equal(reloads, 1);
    assert.equal(store.get("chunk-reload-at"), String(now), "attempt timestamp is persisted");

    // 同一冷却窗口内的第二次失败不再重载（避免 reload 死循环）
    assert.equal(attemptChunkRecovery(new Error("Loading chunk 6695 failed."), now + 500), false);
    assert.equal(reloads, 1);

    // 冷却窗口过后可以再次恢复
    assert.equal(attemptChunkRecovery(new Error("Loading chunk 6695 failed."), now + 10_000), true);
    assert.equal(reloads, 2);

    // 非 chunk 错误永不触发重载
    assert.equal(attemptChunkRecovery(new Error("普通业务错误"), now + 100_000), false);
    assert.equal(reloads, 2);
  } finally {
    (globalThis as { window?: unknown }).window = original;
  }
});
