"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import Link from "next/link";

export function ServerNotice() {
  const [show, setShow] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("server-notice-dismissed");
    if (dismissed) return;

    const timer = setTimeout(() => {
      setShow(true);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setClosing(true);
    sessionStorage.setItem("server-notice-dismissed", "1");
    setTimeout(() => setShow(false), 300);
  };

  if (!show) return null;

  return (
    <div
      className={`fixed top-16 left-0 right-0 z-30 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-700 ${closing ? "animate-fade-out" : "animate-fade-in-down"}`}
    >
      <Link
        href="/news/cmrs2x02p000004jyhpbp2iki"
        className="flex items-center gap-3 px-4 md:px-6 py-2.5 text-left hover:bg-neutral-800/60 transition-colors"
      >
        <AlertTriangle className="w-4 h-4 text-white flex-shrink-0" />
        <p className="text-xs md:text-sm text-neutral-300 leading-relaxed flex-1 min-w-0">
          服务器位于海外，缩略图与视频资源加载可能较慢。点击了解详情与后续优化计划。
        </p>
        <X
          className="w-4 h-4 text-neutral-500 hover:text-white transition-colors flex-shrink-0"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dismiss();
          }}
        />
      </Link>
    </div>
  );
}