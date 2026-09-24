"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function WorkReturnLinkView({ from }: { from: string | null }) {
  const fromHome = from === "home";

  return (
    <Link
      href={fromHome ? "/" : "/works"}
      className="inline-flex items-center gap-2 text-sm text-neutral-300 hover:text-white border border-neutral-400 hover:border-white px-4 py-2 transition-all duration-300"
    >
      <ArrowLeft className="w-4 h-4" />
      {fromHome ? "返回主页" : "返回作品列表"}
    </Link>
  );
}

export function WorkReturnLink() {
  const searchParams = useSearchParams();

  return <WorkReturnLinkView from={searchParams.get("from")} />;
}
