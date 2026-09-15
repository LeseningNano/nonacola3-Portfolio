"use client";

import { useEffect } from "react";
import { attemptChunkRecovery } from "@/lib/chunk-recovery";

// 错误边界只覆盖渲染期异常；路由切换时的 chunk 拉取失败可能直接抛到 window，
// 这里补一层全局兜底，走同一份冷却记录。
export function ChunkRecovery() {
  useEffect(() => {
    function handleError(event: ErrorEvent) {
      attemptChunkRecovery(event.error ?? new Error(event.message));
    }

    function handleRejection(event: PromiseRejectionEvent) {
      attemptChunkRecovery(event.reason);
    }

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}
