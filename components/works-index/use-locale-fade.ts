"use client";

import { useCallback, useEffect, useRef } from "react";
import { useWorksLanguage } from "./works-language-provider";

// 语言切换时对标记元素用 WAAPI 原位播放一次轻淡入。
// 故意不做 DOM 重挂载：实测 keyed 重挂载会让部分元素（如 works-intro 的 h1）
// 在提交后残留旧节点；原位更新则始终可靠。reduced-motion 下不播放。
export function useLocaleFade() {
  const { locale } = useWorksLanguage();
  const firstRender = useRef(true);
  const elements = useRef(new Set<HTMLElement>());

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (const el of elements.current) {
      el.animate([{ opacity: 0.3 }, { opacity: 1 }], {
        duration: 280,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      });
    }
  }, [locale]);

  return useCallback((el: HTMLElement | null) => {
    if (el) {
      elements.current.add(el);
    } else {
      // 元素卸载时顺手清掉已断开的引用，避免 Set 持有游离节点
      for (const item of elements.current) {
        if (!item.isConnected) elements.current.delete(item);
      }
    }
  }, []);
}
