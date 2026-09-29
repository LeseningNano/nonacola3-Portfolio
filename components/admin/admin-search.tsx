"use client";

import { Search } from "lucide-react";

export function AdminSearch({ id, label, value, placeholder, onChange }: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative min-w-0">
      <label htmlFor={id} className="sr-only">{label}</label>
      <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-admin-fg-3" />
      <input
        id={id}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 w-full min-w-0 rounded-sm border border-admin-line-strong bg-admin-raised pr-2.5 pl-8 text-[13px] text-admin-fg placeholder:text-admin-fg-3 focus:border-admin-accent focus:outline-none"
      />
    </div>
  );
}
