"use client";

import { useState, useEffect } from "react";
import { siteConfig } from "@/lib/config";

export function LoadingScreen({ onReady }: { onReady: () => void }) {
  const [fadeOut, setFadeOut] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + Math.random() * 15 + 5;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const timer = setTimeout(() => {
        setFadeOut(true);
        setTimeout(onReady, 500);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [progress, onReady]);

  return (
    <div
      data-hero-loader
      className={`fixed inset-0 z-[9999] bg-[#0a0a0a] transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="w-full h-full flex items-center justify-center p-6">
        <div className="w-full max-w-lg space-y-3" style={{ fontFamily: "'Courier New', monospace" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[#D2D7D5] text-lg tracking-wider font-bold">{siteConfig.name.toUpperCase()}</span>
            <span className="text-[#D2D7D5] text-xs">LOADING</span>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white px-5 py-4">
              <div className="text-[10px] leading-relaxed">
                <span className="text-black">CODING:</span><br />
                <span className="text-black">OPENCODE / XIAOMI MIMO / Google Gemini 3.0 Pro</span><br />
                <span className="text-black">DESIGN:</span><br />
                <span className="text-black">NONACOLA3</span><br />
                <span className="text-black">HOST:</span><br />
                <span className="text-black">VERCEL</span>
              </div>
            </div>
            <div className="border border-zinc-700 px-5 py-4">
              <div className="text-[#D2D7D5] text-[10px] tracking-widest mb-2">VER</div>
              <div className="text-[#D2D7D5] text-xs">03</div>
            </div>
          </div>

          {/* Description */}
          <div className="border border-zinc-700 px-5 py-4">
            <div className="text-[#D2D7D5] text-[10px] tracking-widest mb-2">INFO</div>
            <div className="text-[#D2D7D5] text-[11px] leading-relaxed">
              VIDEO PORTFOLIO / {siteConfig.description.toUpperCase()}
            </div>
          </div>

          {/* Progress bar */}
          <div className="border border-zinc-700 px-5 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#D2D7D5] text-[10px] tracking-widest">PROGRESS</span>
              <span className="text-[#D2D7D5] text-xs">{Math.min(100, Math.floor(progress))}%</span>
            </div>
            <div className="w-full h-px bg-zinc-800 relative">
              <div
                className="absolute left-0 top-0 h-full bg-[#D2D7D5] transition-all duration-300"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[#D2D7D5] text-[10px]">© {new Date().getFullYear()}</span>
            <span className="text-[#D2D7D5] text-[10px]">MADE WITH LOVE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
