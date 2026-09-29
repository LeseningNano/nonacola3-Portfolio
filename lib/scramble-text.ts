// 章节标题「解码」动画的纯逻辑：逐字出现，每个字先以乱码现身，
// 定格后显示原字；副标题在标题出到一半时开始擦出。
// 时间参数与 Design 画布「动效方案」第 2 项一致。

export const SCRAMBLE_STEP_MS = 70;
export const SCRAMBLE_SETTLE_MS = 350;
export const SUBTITLE_WIPE_MS = 480;
export const SCRAMBLE_GLYPHS = "#%&*+=?/<>[]{}01";

export function getScrambleFrame(
  text: string,
  elapsedMs: number,
  random: () => number = Math.random
): string {
  const chars = Array.from(text);
  let out = "";
  for (let i = 0; i < chars.length; i++) {
    const start = i * SCRAMBLE_STEP_MS;
    if (elapsedMs < start) break;
    if (chars[i] === " " || elapsedMs >= start + SCRAMBLE_SETTLE_MS) {
      out += chars[i];
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

export function getScrambleDurationMs(text: string): number {
  const length = Array.from(text).length;
  return length === 0 ? 0 : (length - 1) * SCRAMBLE_STEP_MS + SCRAMBLE_SETTLE_MS;
}

export function getSubtitleDelayMs(text: string): number {
  return Math.floor(Array.from(text).length / 2) * SCRAMBLE_STEP_MS + 60;
}
