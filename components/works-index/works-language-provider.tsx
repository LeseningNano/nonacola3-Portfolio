"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  DEFAULT_WORKS_LOCALE,
  WORKS_LOCALE_STORAGE_KEY,
  getWorksCopy,
  isWorksLocale,
} from "@/lib/works-copy";
import type { WorksCopy, WorksLocale } from "@/lib/works-copy";

interface WorksLanguageContextValue {
  locale: WorksLocale;
  copy: WorksCopy;
  setLocale: (locale: WorksLocale) => void;
  ready: boolean;
}

// 英文默认值：隔离的服务端渲染测试与 SSR 首帧输出保持稳定
const DEFAULT_CONTEXT_VALUE: WorksLanguageContextValue = {
  locale: DEFAULT_WORKS_LOCALE,
  copy: getWorksCopy(DEFAULT_WORKS_LOCALE),
  setLocale: () => {},
  ready: false,
};

const WorksLanguageContext = createContext<WorksLanguageContextValue>(
  DEFAULT_CONTEXT_VALUE
);

export function useWorksLanguage(): WorksLanguageContextValue {
  return useContext(WorksLanguageContext);
}

export function WorksLanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<WorksLocale>(DEFAULT_WORKS_LOCALE);
  const [ready, setReady] = useState(false);

  // hydration 后恢复本地存储里的语言；存储不可用时也要置 ready。
  // setState 放在 rAF 回调中，避免 effect 内同步触发的级联渲染。
  useEffect(() => {
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      if (cancelled) return;
      let stored: unknown = null;
      try {
        stored = window.localStorage.getItem(WORKS_LOCALE_STORAGE_KEY);
      } catch {
        setReady(true);
        return;
      }
      if (isWorksLocale(stored)) setLocaleState(stored);
      setReady(true);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, []);

  const setLocale = useCallback((next: WorksLocale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(WORKS_LOCALE_STORAGE_KEY, next);
    } catch {
      // 存储失败不阻止界面切换
    }
  }, []);

  const value = useMemo<WorksLanguageContextValue>(
    () => ({ locale, copy: getWorksCopy(locale), setLocale, ready }),
    [locale, setLocale, ready]
  );

  // lang 只作用在 /works 内容区的这个元素上，不改全站根节点语言
  return (
    <WorksLanguageContext.Provider value={value}>
      <div lang={locale}>{children}</div>
    </WorksLanguageContext.Provider>
  );
}
