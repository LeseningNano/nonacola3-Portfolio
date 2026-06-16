"use client";

import { useEffect, useState } from "react";

export function MobileWarning() {
  const [isMobile, setIsMobile] = useState(false);
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const check = () => {
      const ua = navigator.userAgent;
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      const narrow = window.innerWidth < 768;
      setIsMobile(mobile || narrow);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = "hidden";
      setVisible(true);
    }
  }, [isMobile]);

  function handleContinue() {
    setFadeOut(true);
    setTimeout(() => {
      setVisible(false);
      document.body.style.overflow = "";
    }, 400);
  }

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#0a0a0a] transition-opacity duration-400 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="px-8 text-center max-w-sm">
        <p className="text-zinc-200 text-lg leading-relaxed mb-10">
          该网页尚未适配移动端，可能出现未预料的问题
        </p>
        <button
          onClick={handleContinue}
          className="px-8 py-3 border border-zinc-500 text-zinc-300 text-sm tracking-wider uppercase hover:bg-zinc-800 transition-colors"
        >
          坚持访问
        </button>
      </div>
    </div>
  );
}
