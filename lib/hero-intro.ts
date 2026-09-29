// Hero 入场节奏（Design 画布「动效方案」第 1 项）：
// 名字逐字从遮罩下升起，副标题与按钮紧随其后。
export const HERO_LETTER_STAGGER_MS = 40;
export const HERO_SUBTITLE_DELAY_MS = 160;
export const HERO_BUTTON_DELAY_MS = 280;

export function getHeroLetters(name: string): Array<{ char: string; delayMs: number }> {
  return Array.from(name).map((char, index) => ({
    char,
    delayMs: index * HERO_LETTER_STAGGER_MS,
  }));
}
