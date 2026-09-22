import type { ReactNode } from "react";

export function AdminEditorHeader({
  title,
  status,
  backAction,
  children,
}: {
  title: ReactNode;
  status: ReactNode;
  backAction: ReactNode;
  children: ReactNode;
}) {
  return (
    <header className="sticky top-14 z-20 -mx-4 flex flex-col gap-3 border-b border-white/10 bg-[#0a0a0a]/95 px-4 py-3 backdrop-blur md:top-0 md:-mx-6 md:flex-row md:items-center md:justify-between md:px-6 lg:-mx-8 lg:px-8">
      <div className="flex min-w-0 items-center gap-2">
        {backAction}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">{title}</div>
          <div className="text-xs text-neutral-400" aria-live="polite">{status}</div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">{children}</div>
    </header>
  );
}
