// /works 索引页专用轻量文案字典。只包含固定界面文案；
// 作品标题、分类、摘要、Role/Tools 的值来自数据库，永远不进这里。

export type WorksLocale = "en" | "zh-CN";

export const DEFAULT_WORKS_LOCALE: WorksLocale = "en";

export const WORKS_LOCALE_STORAGE_KEY = "portfolio-works-locale";

type HeadlineToken = { text: string; highlighted: boolean };

export const WORKS_COPY = {
  en: {
    language: { english: "EN", chinese: "中文", label: "Language" },
    intro: {
      eyebrow: "MOTION DESIGNER · CHINA",
      headlineTokens: [
        { text: "Motion", highlighted: true },
        { text: "Designer", highlighted: true },
        { text: "creating", highlighted: false },
        { text: "PV,", highlighted: true },
        { text: "game", highlighted: true },
        { text: "promotional", highlighted: true },
        { text: "visuals", highlighted: true },
        { text: "and", highlighted: false },
        { text: "cinematic", highlighted: true },
        { text: "motion", highlighted: true },
        { text: "graphics.", highlighted: true },
      ] satisfies HeadlineToken[],
      availability: "Available for motion design, compositing and promotional visual work.",
      focusLabel: "Focus",
      toolsLabel: "Tools",
    },
    showreel: {
      label: "SHOWREEL 2026",
      title: "Motion Design / PV / Compositing / 3D",
      description: "A collection of motion design, PV and visual experiments.",
      frameTitle: "Showreel 2026",
      playLabel: "Play Showreel 2026",
    },
    selected: {
      heading: "Selected Works",
      description: "A selection of projects that represent my motion design workflow.",
      roleLabel: "Role",
      toolsLabel: "Tools",
      viewCaseStudy: "View Case Study",
      linkLabel: (title: string) => `View case study: ${title}`,
    },
    archive: { heading: "All Works", empty: "Work is currently being updated." },
    contact: { eyebrow: "AVAILABLE FOR OPPORTUNITIES", heading: "Let's work together." },
  },
  "zh-CN": {
    language: { english: "EN", chinese: "中文", label: "语言" },
    intro: {
      eyebrow: "动效设计师 · 中国",
      headlineTokens: [
        { text: "动效设计师，", highlighted: true },
        { text: "聚焦", highlighted: false },
        { text: " PV、", highlighted: true },
        { text: "游戏宣传视觉", highlighted: true },
        { text: "与", highlighted: false },
        { text: "电影感动态图形。", highlighted: true },
      ] satisfies HeadlineToken[],
      availability: "可承接动效设计、合成与宣传视觉相关工作。",
      focusLabel: "方向",
      toolsLabel: "工具",
    },
    showreel: {
      label: "作品集锦 2026",
      title: "动效设计 / PV / 合成 / 3D",
      description: "动效设计、PV 与视觉实验作品合集。",
      frameTitle: "2026 作品集锦",
      playLabel: "播放 2026 作品集锦",
    },
    selected: {
      heading: "精选作品",
      description: "展示个人动效设计流程与能力的代表项目。",
      roleLabel: "职责",
      toolsLabel: "工具",
      viewCaseStudy: "查看项目详情",
      linkLabel: (title: string) => `查看项目详情：${title}`,
    },
    archive: { heading: "全部作品", empty: "作品正在更新中。" },
    contact: { eyebrow: "可接受工作机会", heading: "期待与你合作。" },
  },
} as const;

export type WorksCopy = (typeof WORKS_COPY)[WorksLocale];

export function isWorksLocale(value: unknown): value is WorksLocale {
  return value === "en" || value === "zh-CN";
}

export function getWorksCopy(locale: WorksLocale): WorksCopy {
  return WORKS_COPY[locale];
}
