import type { ReactNode } from "react";

export type AdminPageHeaderProps = {
  title: string;
  description?: string;
  status?: ReactNode;
  actions?: ReactNode;
};

export function AdminPageHeader({
  title,
  description,
  status,
  actions,
}: AdminPageHeaderProps) {
  return (
    <header className="flex min-w-0 flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-medium tracking-tight text-white sm:text-2xl">{title}</h1>
          {status}
        </div>
        {description ? <p className="text-sm text-neutral-400">{description}</p> : null}
      </div>
      {actions ? <div className="flex min-w-0 flex-wrap items-center gap-2 sm:shrink-0">{actions}</div> : null}
    </header>
  );
}
