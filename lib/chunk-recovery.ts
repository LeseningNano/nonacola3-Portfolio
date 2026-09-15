// 部署窗口期的版本偏移：客户端仍持有旧 HTML，其中引用的 chunk 哈希
// 已被新构建替换，于是动态 import 返回 404 并抛出 chunk 加载失败。
// 重新加载会拿到新 HTML 与正确的哈希，因此在冷却窗口内自动恢复一次。

export const CHUNK_RELOAD_ATTEMPT_KEY = "chunk-reload-at";
export const CHUNK_RELOAD_COOLDOWN_MS = 10_000;

const CHUNK_ERROR_PATTERNS = [
  /Loading chunk \d+ failed/i,
  /Loading CSS chunk \d+ failed/i,
  /ChunkLoadError/i,
  /Failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
];

export function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.name === "ChunkLoadError") return true;

  const message = `${error.name}: ${error.message}`;
  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

export function shouldAutoReload(
  now: number,
  lastAttemptAt: number,
  cooldownMs = CHUNK_RELOAD_COOLDOWN_MS
): boolean {
  return now - lastAttemptAt >= cooldownMs;
}

// 错误边界内与边界外的 chunk 失败共用这一份冷却记录，
// 避免两条路径各自重载造成 reload 死循环。
// 返回是否已触发重载；false 时调用方应展示错误 UI。
export function attemptChunkRecovery(error: unknown, now = Date.now()): boolean {
  if (typeof window === "undefined" || !isChunkLoadError(error)) return false;

  const lastAttemptAt = Number(
    window.sessionStorage.getItem(CHUNK_RELOAD_ATTEMPT_KEY) ?? 0
  );
  if (!shouldAutoReload(now, lastAttemptAt)) return false;

  window.sessionStorage.setItem(CHUNK_RELOAD_ATTEMPT_KEY, String(now));
  window.location.reload();
  return true;
}
