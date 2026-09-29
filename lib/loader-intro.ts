import { SCRAMBLE_GLYPHS } from "./scramble-text";

// 首页首访加载画面的时间线（设计见 docs/superpowers/specs/2026-09-29-loader-decode-intro-design.md）：
// 百分比计数 → 停在 100% → 乱码解码成名字 → 停顿 → 中线亮起 → 上下黑幕拉开 → 结束。

export const LOADER_COUNT_MS = 1000;
export const LOADER_FULL_HOLD_MS = 180;
export const LOADER_MORPH_APPEAR_MS = 40;
export const LOADER_MORPH_STEP_MS = 70;
export const LOADER_MORPH_SETTLE_MS = 250;
export const LOADER_HOLD_MS = 200;
export const LOADER_SEAM_MS = 220;
export const LOADER_CURTAIN_MS = 700;

const FULL_TEXT = "100%";

export type LoaderPhase = "count" | "full" | "morph" | "hold" | "seam" | "open" | "done";

export interface LoaderState {
  phase: LoaderPhase;
  text: string;
  progress: number;
}

export function formatLoaderPercent(percent: number): string {
  const value = Math.min(100, Math.max(0, Math.floor(percent)));
  return `${String(value).padStart(3, "0")}%`;
}

// 缓出：前段走得快、接近 100 时放慢，LOADER_COUNT_MS 时正好到 100
export function getLoaderPercent(elapsedMs: number): number {
  const x = Math.min(1, Math.max(0, elapsedMs / LOADER_COUNT_MS));
  return Math.floor(100 * (1 - (1 - x) * (1 - x)));
}

// 「100%」原有的位置立刻变乱码，多出的位置依次出现，然后从左到右逐个定格为目标字
export function getLoaderMorphFrame(
  from: string,
  to: string,
  elapsedMs: number,
  random: () => number = Math.random
): string {
  const sourceLength = Array.from(from).length;
  const target = Array.from(to);
  let out = "";
  for (let i = 0; i < target.length; i++) {
    const appearAt = i < sourceLength ? 0 : (i - sourceLength + 1) * LOADER_MORPH_APPEAR_MS;
    if (elapsedMs < appearAt) break;
    if (elapsedMs >= LOADER_MORPH_SETTLE_MS + i * LOADER_MORPH_STEP_MS) {
      out += target[i];
      continue;
    }
    const index = Math.min(
      SCRAMBLE_GLYPHS.length - 1,
      Math.floor(random() * SCRAMBLE_GLYPHS.length)
    );
    out += SCRAMBLE_GLYPHS[index];
  }
  return out;
}

export function getLoaderMorphDurationMs(to: string): number {
  const length = Array.from(to).length;
  return length === 0 ? 0 : LOADER_MORPH_SETTLE_MS + (length - 1) * LOADER_MORPH_STEP_MS;
}

export function getLoaderTimeline(name: string) {
  const fullAt = LOADER_COUNT_MS;
  const morphAt = fullAt + LOADER_FULL_HOLD_MS;
  const holdAt = morphAt + getLoaderMorphDurationMs(name);
  const seamAt = holdAt + LOADER_HOLD_MS;
  const revealAt = seamAt + LOADER_SEAM_MS;
  const doneAt = revealAt + LOADER_CURTAIN_MS;
  return { fullAt, morphAt, holdAt, seamAt, revealAt, doneAt };
}

export function getLoaderState(
  elapsedMs: number,
  name: string,
  random: () => number = Math.random
): LoaderState {
  const { fullAt, morphAt, holdAt, seamAt, revealAt, doneAt } = getLoaderTimeline(name);
  if (elapsedMs < fullAt) {
    const percent = getLoaderPercent(elapsedMs);
    return { phase: "count", text: formatLoaderPercent(percent), progress: percent / 100 };
  }
  if (elapsedMs < morphAt) return { phase: "full", text: FULL_TEXT, progress: 1 };
  if (elapsedMs < holdAt) {
    return {
      phase: "morph",
      text: getLoaderMorphFrame(FULL_TEXT, name, elapsedMs - morphAt, random),
      progress: 1,
    };
  }
  if (elapsedMs < seamAt) return { phase: "hold", text: name, progress: 1 };
  if (elapsedMs < revealAt) return { phase: "seam", text: name, progress: 1 };
  if (elapsedMs < doneAt) return { phase: "open", text: name, progress: 1 };
  return { phase: "done", text: name, progress: 1 };
}

// 单帧最多推进 100ms（10 帧以上仍按实时播放）：主线程被 hydration 或慢设备卡住后恢复时，
// 动画只是放慢，不会把计数和解码整段跳过
export const LOADER_MAX_FRAME_MS = 100;

export function advanceLoaderClock(elapsedMs: number, frameDeltaMs: number): number {
  return elapsedMs + Math.min(Math.max(frameDeltaMs, 0), LOADER_MAX_FRAME_MS);
}

// 刷新 / 回访，或开启「减少动态效果」时不播放加载画面
export function shouldSkipLoader(heroLoaded: boolean, reducedMotion: boolean): boolean {
  return heroLoaded || reducedMotion;
}
