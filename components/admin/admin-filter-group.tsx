"use client";

import { cn } from "@/lib/utils";

export type AdminFilterOption<T extends string> = { value: T; label: string; count?: number };

export function AdminFilterGroup<T extends string>({ label, value, options, onChange, disabled = false }: {
  label: string;
  value: T;
  options: Array<AdminFilterOption<T>>;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-sm px-2.5 text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent disabled:pointer-events-none disabled:opacity-50",
              active ? "bg-admin-selected text-white" : "text-admin-fg-2 hover:bg-admin-raised hover:text-admin-fg",
            )}
          >
            {option.label}
            {option.count !== undefined ? <span className="font-admin-mono text-xs text-admin-fg-3">{option.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
