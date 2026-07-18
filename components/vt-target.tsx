"use client";

export function VtTarget({
  name,
  className,
  children,
}: {
  name: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      ref={(el) => {
        if (el) el.style.viewTransitionName = name;
      }}
      className={className}
    >
      {children}
    </div>
  );
}
