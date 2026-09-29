import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { AdminStatus, type AdminStatusTone } from "@/components/admin/admin-status";
import { Button } from "@/components/ui/button";

export type AdminEditorStatus = { tone: AdminStatusTone; label: string };

export function AdminEditorHeader({
  section,
  title,
  status,
  onBack,
  children,
}: {
  section: "WORKS" | "NEWS";
  title: ReactNode;
  status: AdminEditorStatus;
  onBack: () => void;
  children: ReactNode;
}) {
  return (
    <header className="sticky top-14 z-20 -mx-4 -mt-6 flex flex-col gap-3 border-b border-admin-line bg-admin-panel/95 px-4 py-2.5 backdrop-blur md:top-0 md:-mx-6 md:-mt-8 md:flex-row md:items-center md:justify-between md:px-6 lg:-mx-8 lg:px-8">
      <div className="flex min-w-0 items-center gap-2">
        <Button type="button" variant="ghost" size="icon" onClick={onBack} aria-label="返回" title="返回" className="shrink-0 text-admin-fg-2">
          <ArrowLeft aria-hidden="true" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-admin-fg">
            <span className="mr-1.5 font-admin-mono text-xs text-admin-fg-3">{section} /</span>
            {title}
          </p>
          <div aria-live="polite"><AdminStatus tone={status.tone}>{status.label}</AdminStatus></div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-1.5">{children}</div>
    </header>
  );
}

// 三个编辑器共用的保存状态映射
export function getEditorStatus(status: "clean" | "dirty" | "saving" | "saved" | "error", isDirty: boolean): AdminEditorStatus {
  if (status === "saving") return { tone: "saving", label: "保存中…" };
  if (status === "error") return { tone: "error", label: "保存失败" };
  if (isDirty) return { tone: "dirty", label: "有未保存更改" };
  if (status === "saved") return { tone: "saved", label: "已保存" };
  return { tone: "ordinary", label: "所有更改已保存" };
}
