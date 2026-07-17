"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

export function ServerNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("server-notice-dismissed");
    if (dismissed) return;

    const timer = setTimeout(() => {
      setShow(true);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setShow(false);
    sessionStorage.setItem("server-notice-dismissed", "1");
  };

  if (!show) return null;

  return (
    <div className="fixed top-20 right-6 z-50 max-w-sm animate-slide-in-right">
      <div className="bg-neutral-900/95 border border-neutral-700 backdrop-blur-md px-4 py-3 shadow-xl flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
        <p className="text-sm text-neutral-300 leading-relaxed" style={{ whiteSpace: "pre-line" }}>
          服务器位于海外，缩略图与视频资源加载可能较慢。
          后期将迁移至阿里云对象存储提升加载速度，如有任何不便还请谅解。
        </p>
        <button
          onClick={dismiss}
          className="text-neutral-500 hover:text-white transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
