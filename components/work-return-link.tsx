"use client";

import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ReturnLink } from "@/components/scroll-memory";

// 从首页点进来：回首页（原位置，没有记录就回 works 板块）；其余：回 Works 页（原位置或顶部）
export function WorkReturnLinkView({ from }: { from: string | null }) {
  const fromHome = from === "home";

  return (
    <ReturnLink
      href={fromHome ? "/" : "/works"}
      page={fromHome ? "home" : "works"}
      section={fromHome ? "works" : undefined}
      className="inline-flex items-center gap-2 text-sm text-neutral-300 hover:text-white border border-neutral-400 hover:border-white px-4 py-2 transition-all duration-300"
    >
      <ArrowLeft className="w-4 h-4" />
      {fromHome ? "返回主页" : "返回作品列表"}
    </ReturnLink>
  );
}

export function WorkReturnLink() {
  const searchParams = useSearchParams();

  return <WorkReturnLinkView from={searchParams.get("from")} />;
}
