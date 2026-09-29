import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminStatusTone = "featured" | "ordinary" | "published" | "draft" | "dirty" | "saving" | "saved" | "error";

const text: Record<AdminStatusTone, string> = {
  featured: "text-admin-accent-text",
  dirty: "text-admin-accent-text",
  published: "text-admin-success-text",
  saved: "text-admin-success-text",
  error: "text-admin-danger",
  ordinary: "text-admin-fg-3",
  draft: "text-admin-fg-3",
  saving: "text-admin-fg-2",
};

const dot: Record<Exclude<AdminStatusTone, "saving">, string> = {
  featured: "bg-admin-accent",
  dirty: "bg-admin-accent",
  published: "bg-admin-success",
  saved: "bg-admin-success",
  error: "bg-admin-danger",
  ordinary: "border-[1.5px] border-admin-fg-3",
  draft: "border-[1.5px] border-admin-fg-3",
};

export function AdminStatus({ tone, children, className }: { tone: AdminStatusTone; children?: ReactNode; className?: string }) {
  return (
    <span data-admin-status={tone} className={cn("inline-flex w-max items-center gap-1.5 text-xs leading-4", text[tone], className)}>
      {tone === "saving"
        ? <Loader2 aria-hidden="true" className="size-3 animate-spin motion-reduce:animate-none" />
        : <span aria-hidden="true" className={cn("size-[7px] shrink-0 rounded-full", dot[tone])} />}
      {children}
    </span>
  );
}
