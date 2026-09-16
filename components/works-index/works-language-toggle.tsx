"use client";

import { useEffect, useState } from "react";
import { useWorksLanguage } from "./works-language-provider";
import type { WorksLocale } from "@/lib/works-copy";

// 紧凑的 EN / 中文 切换器：沿用现有黑白与中性灰视觉语言，
// 两个原生 button，aria-pressed 表明当前语言，键盘原生可操作。
// 页面加载时隐藏，等 works 开场动画结束（portfolio-intro-done）后淡入。
export function WorksLanguageToggle() {
  const { locale, copy, setLocale } = useWorksLanguage();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    function handleIntroDone() {
      setShown(true);
    }
    window.addEventListener("portfolio-intro-done", handleIntroDone, { once: true });
    return () =>
      window.removeEventListener("portfolio-intro-done", handleIntroDone);
  }, []);

  const options: Array<{ value: WorksLocale; label: string }> = [
    { value: "en", label: copy.language.english },
    { value: "zh-CN", label: copy.language.chinese },
  ];

  return (
    <div
      role="group"
      aria-label={copy.language.label}
      className={`inline-flex items-center transition-opacity duration-700 motion-reduce:transition-none ${
        shown ? "opacity-100" : "opacity-0"
      }`}
    >
      {options.map((option, index) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={locale === option.value}
          onClick={() => setLocale(option.value)}
          className={`px-3 py-1.5 text-xs tracking-widest transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
            index > 0 ? "border-l border-neutral-700" : ""
          } ${
            locale === option.value
              ? "text-white"
              : "text-neutral-500 hover:text-neutral-300"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
