import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function AdminEmptyState({ icon: Icon, title, description, action }: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg bg-admin-panel px-6 py-14 text-center">
      <Icon aria-hidden="true" className="size-6 text-admin-fg-3" />
      <p className="text-sm text-admin-fg">{title}</p>
      {description ? <p className="max-w-sm text-xs leading-5 text-admin-fg-3">{description}</p> : null}
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
