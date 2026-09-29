import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

export type AdminPageHeaderProps = {
  title: string;
  subtitle: string;
  meta?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
};

export function AdminPageHeader({ title, subtitle, meta, actions, back }: AdminPageHeaderProps) {
  return (
    <header className="flex min-w-0 flex-col gap-4 pb-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 space-y-1.5">
        {back ? (
          <Link href={back.href} className="inline-flex items-center gap-1 rounded-sm text-xs text-admin-fg-2 transition-colors hover:text-admin-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent">
            <ArrowLeft aria-hidden="true" className="size-3.5" />{back.label}
          </Link>
        ) : null}
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 aria-label={subtitle} className="font-pixel text-[1.75rem] leading-none tracking-wide text-white">{title}</h1>
          <span aria-hidden="true" className="text-sm text-admin-fg-2">{subtitle}</span>
        </div>
        {meta ? <p className="font-admin-mono text-xs text-admin-fg-3">{meta}</p> : null}
      </div>
      {actions ? <div className="flex min-w-0 flex-wrap items-center gap-2 sm:shrink-0">{actions}</div> : null}
    </header>
  );
}
