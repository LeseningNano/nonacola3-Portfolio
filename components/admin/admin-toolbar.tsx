import type { ReactNode } from "react";

export function AdminToolbar({ filters, search, actions }: { filters: ReactNode; search?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-lg bg-admin-panel p-1.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-1">{filters}</div>
      {search || actions ? (
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          {search ? <div className="min-w-0 flex-1 sm:w-60 sm:flex-none">{search}</div> : null}
          {actions ? <div className="flex shrink-0 items-center gap-1.5">{actions}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
