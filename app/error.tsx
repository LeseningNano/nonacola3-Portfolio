"use client";

import { useEffect } from "react";
import { attemptChunkRecovery } from "@/lib/chunk-recovery";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
    // 部署窗口期：旧页面引用的 chunk 哈希已被新构建替换，动态 import 拿到 404。
    // 重新加载即可获得新 HTML 与正确哈希，因此自动恢复一次；
    // 冷却窗口内不再重载，改为停留在此错误 UI，避免 reload 死循环。
    attemptChunkRecovery(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-normal tracking-tight text-white mb-4" style={{ fontFamily: "var(--font-bitcount)" }}>
          出错了。
        </h1>
        <p className="text-neutral-400 mb-8">
          {error.message || "页面加载失败，请稍后重试。"}
        </p>
        <button
          onClick={unstable_retry}
          className="inline-flex items-center gap-2 text-sm text-neutral-300 hover:text-white border border-neutral-400 hover:border-white px-5 py-2.5 transition-all duration-300"
        >
          重试
        </button>
      </div>
    </div>
  );
}
