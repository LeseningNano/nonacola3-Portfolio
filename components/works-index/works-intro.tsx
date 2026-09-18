"use client";

import { useEffect } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useWorksLanguage } from "./works-language-provider";
import styles from "./works-intro.module.css";

// works-intro.module.css 中最后一个动画：supporting 块 1260ms 延迟 + 600ms 淡入。
// 改 CSS 动画时长时需同步此常量。
const INTRO_TOTAL_MS = 1900;

export function WorksIntro({ children }: { children: ReactNode }) {
  const { locale, copy } = useWorksLanguage();
  const tokens = copy.intro.headlineTokens;

  // 开场动画结束后通知导航栏弹出；reduced-motion 下 CSS 直接显示，立即通知。
  // 语言切换只改文字并重播各自动画，不重发该事件。
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      window.dispatchEvent(new CustomEvent("portfolio-intro-done"));
      return;
    }
    const timer = setTimeout(() => {
      window.dispatchEvent(new CustomEvent("portfolio-intro-done"));
    }, INTRO_TOTAL_MS);
    return () => clearTimeout(timer);
  }, []);

  // 英文按词空格连接；中文不插入空格，拉丁字符间的空格已含在 token 内
  const separator = locale === "en" ? " " : "";
  const fullHeadline = tokens.map((token) => token.text).join(separator);
  // 字距沿用原有设计不随语言变化；仅行高按语言区分（中文放宽）
  const headlineLeading = locale === "en" ? "leading-[1.05]" : "leading-[1.18]";

  return (
    <div>
      <header>
        <p
          key={locale}
          className={`${styles.supporting} text-xs tracking-[0.28em] text-neutral-400`}
        >
          {copy.intro.eyebrow}
        </p>
        <div className="mt-5 grid gap-7 md:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)] md:items-end md:gap-12">
          <h1
            aria-label={fullHeadline}
            className={`text-4xl font-normal tracking-[-0.035em] sm:text-5xl md:text-6xl ${headlineLeading}`}
          >
            {tokens.map((token, index) => (
              <span
                key={`${token.text}-${index}`}
                aria-hidden="true"
                className={`${styles.word} ${token.highlighted ? "text-white" : "text-neutral-500"}`}
                style={{ "--word-index": index } as CSSProperties}
              >
                {token.text}
                {separator}
              </span>
            ))}
          </h1>
          {/* 眉标与简介栏切语言时重播：标题逐词动画期间保持隐藏，1260ms 后一起淡入 */}
          <div key={locale} className={styles.supporting}>
            <p className="text-sm leading-6 text-neutral-400 md:text-base">{copy.intro.availability}</p>
            <dl className="mt-5 space-y-2 border-y border-white/10 py-4 text-sm">
              <div className="grid grid-cols-[4rem_1fr] gap-3">
                <dt className="text-neutral-500">{copy.intro.focusLabel}</dt>
                <dd className="text-neutral-300">PV · Compositing · 3D</dd>
              </div>
              <div className="grid grid-cols-[4rem_1fr] gap-3">
                <dt className="text-neutral-500">{copy.intro.toolsLabel}</dt>
                <dd className="text-neutral-300">After Effects · Blender</dd>
              </div>
            </dl>
          </div>
        </div>
      </header>
      {/* Showreel 槽位不随语言重挂载，避免重置播放器状态；淡入节奏与简介栏一致 */}
      <div className={styles.supporting}>{children}</div>
    </div>
  );
}
