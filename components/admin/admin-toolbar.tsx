import type { ReactNode } from "react";

export function AdminToolbar({ filters, search, actions }: { filters: ReactNode; search: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-3 border-b border-white/10 pb-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-1.5">{filters}</div>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1 sm:w-60 sm:flex-none">{search}</div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
