import type { ReactNode } from "react";

export function AdminFormSection({ index, title, description, children }: { index: string; title: string; description?: string; children: ReactNode }) {
  return (
    <section className="min-w-0 space-y-4 border-t border-admin-line pt-6 first:border-t-0 first:pt-0">
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span className="font-admin-mono text-xs text-admin-fg-3">{index}</span>
        <h2 className="text-sm font-medium text-admin-fg">{title}</h2>
        {description ? <p className="text-xs text-admin-fg-3">{description}</p> : null}
      </div>
      <div className="min-w-0 space-y-4">{children}</div>
    </section>
  );
}
