"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

export function ServerNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("server-notice-dismissed");
    if (!dismissed) {
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    sessionStorage.setItem("server-notice-dismissed", "1");
  };

  if (!show) return null;

  return (
    <div className="fixed top-20 right-6 z-50 max-w-sm animate-slide-in-right">
      <div className="bg-zinc-900/95 border border-zinc-700 backdrop-blur-md px-4 py-3 shadow-xl flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-zinc-300 leading-relaxed">
          服务器位于海外，加载可能较慢。如遇访问困难，请尝试开启科学上网环境。
        </p>
        <button
          onClick={dismiss}
          className="text-zinc-500 hover:text-white transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
