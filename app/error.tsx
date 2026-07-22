"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="font-heading text-3xl font-normal tracking-tight text-white mb-4">
          出错了。
        </h1>
        <p className="text-neutral-400 mb-8">
          {error.message || "页面加载失败，请稍后重试。"}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 text-sm text-neutral-300 hover:text-white border border-neutral-400 hover:border-white px-5 py-2.5 transition-all duration-300"
        >
          重试
        </button>
      </div>
    </div>
  );
}