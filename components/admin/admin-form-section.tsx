import type { ReactNode } from "react";

export function AdminFormSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="grid min-w-0 gap-4 border-b border-white/10 pb-7 last:border-0 sm:gap-6 lg:grid-cols-[minmax(9rem,0.36fr)_minmax(0,1fr)] lg:pb-8">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-neutral-500">{description}</p>
      </div>
      <div className="min-w-0 space-y-4">{children}</div>
    </section>
  );
}
