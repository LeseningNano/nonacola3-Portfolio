import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type AdminStatusTone = "neutral" | "featured" | "published" | "draft" | "success" | "danger";

const tones: Record<AdminStatusTone, string> = {
  neutral: "border-white/15 bg-white/[0.04] text-neutral-300",
  featured: "border-amber-400/25 bg-amber-400/10 text-amber-200",
  published: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
  draft: "border-amber-200/20 bg-amber-100/[0.06] text-amber-100/75",
  success: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
  danger: "border-red-400/25 bg-red-400/10 text-red-200",
};

export function AdminStatusBadge({ tone, children }: { tone: AdminStatusTone; children?: ReactNode }) {
  return (
    <span
      data-admin-status={tone}
      className={cn("inline-flex w-max items-center rounded-full border px-2 py-0.5 text-[11px] font-medium leading-4", tones[tone])}
    >
      {children}
    </span>
  );
}
