"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { logoutAdmin } from "@/app/(admin)/dashboard/actions";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ADMIN_NAV_ITEMS, getActiveAdminItem } from "@/lib/admin-navigation";

type AdminShellProps = {
  children: ReactNode;
  userName?: string | null;
};

type NavigationGuard = () => boolean;

const AdminNavigationGuardContext = createContext<{
  registerNavigationGuard: (guard: NavigationGuard) => () => void;
  confirmNavigation: () => boolean;
} | null>(null);

function AdminNavigationGuardProvider({ children }: { children: ReactNode }) {
  const guardRef = useRef<NavigationGuard | null>(null);
  const registerNavigationGuard = useCallback((guard: NavigationGuard) => {
    guardRef.current = guard;
    return () => {
      if (guardRef.current === guard) guardRef.current = null;
    };
  }, []);
  const confirmNavigation = useCallback(() => guardRef.current?.() ?? true, []);
  const value = useMemo(
    () => ({ registerNavigationGuard, confirmNavigation }),
    [confirmNavigation, registerNavigationGuard],
  );

  return <AdminNavigationGuardContext.Provider value={value}>{children}</AdminNavigationGuardContext.Provider>;
}

export function useAdminNavigationGuard(guard: NavigationGuard) {
  const context = useContext(AdminNavigationGuardContext);

  useEffect(() => context?.registerNavigationGuard(guard), [context, guard]);
}

function useGuardedNavigation(onNavigate?: () => void) {
  const context = useContext(AdminNavigationGuardContext);

  return useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return;
    if (context && !context.confirmNavigation()) {
      event.preventDefault();
      return;
    }
    onNavigate?.();
  }, [context, onNavigate]);
}

function AdminNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const activeItem = getActiveAdminItem(pathname);
  const handleNavigation = useGuardedNavigation(onNavigate);

  return (
    <nav aria-label="管理员导航" className="flex flex-col gap-1">
      {ADMIN_NAV_ITEMS.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          aria-current={activeItem === item.id ? "page" : undefined}
          onClick={handleNavigation}
          className={`rounded-md px-3 py-2 text-sm transition-colors ${
            activeItem === item.id
              ? "bg-white text-black"
              : "text-neutral-400 hover:bg-white/10 hover:text-white"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function AdminAccount({ userName }: { userName?: string | null }) {
  const handleNavigation = useGuardedNavigation();

  return (
    <div className="border-t border-white/10 pt-4">
      {userName ? <p className="mb-3 truncate px-3 text-sm text-neutral-400">{userName}</p> : null}
      <Link href="/" onClick={handleNavigation} className="block rounded-md px-3 py-2 text-sm text-neutral-400 transition-colors hover:bg-white/10 hover:text-white">
        View site
      </Link>
      <form action={logoutAdmin}>
        <button type="submit" className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-neutral-400 transition-colors hover:bg-white/10 hover:text-white">
          <LogOut aria-hidden="true" className="size-4" />
          Sign out
        </button>
      </form>
    </div>
  );
}

export function AdminShell({ children, userName }: AdminShellProps) {
  const pathname = usePathname();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMobileNavigationOpen(false));
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  function handleMobileNavigationChange(open: boolean) {
    setMobileNavigationOpen(open);
    if (!open) requestAnimationFrame(() => triggerRef.current?.focus());
  }

  return <AdminNavigationGuardProvider>
    <div className="min-h-screen bg-[#0a0a0a] text-white [--admin-sidebar-width:12rem]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[var(--admin-sidebar-width)] flex-col border-r border-white/10 bg-[#0a0a0a] p-4 md:flex">
        <AdminBrand className="mb-8 px-3 text-sm font-medium tracking-wide text-white" />
        <AdminNavigation />
        <div className="mt-auto"><AdminAccount userName={userName} /></div>
      </aside>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-white/10 bg-[#0a0a0a]/95 px-4 backdrop-blur md:hidden">
        <AdminBrand className="text-sm font-medium tracking-wide text-white" />
        <Dialog open={mobileNavigationOpen} onOpenChange={handleMobileNavigationChange}>
          <DialogTrigger
            ref={triggerRef}
            aria-label="打开管理员导航"
            className="rounded-md p-2 text-neutral-300 hover:bg-white/10 hover:text-white"
          >
            <Menu aria-hidden="true" className="size-5" />
          </DialogTrigger>
          <DialogContent showCloseButton={false} className="inset-y-0 left-0 h-dvh w-[min(20rem,calc(100%-3rem))] max-w-none translate-x-0 translate-y-0 rounded-none border-r border-white/10 bg-[#0a0a0a] p-4 text-white sm:max-w-none">
            <div className="mb-8 flex items-center justify-between">
              <DialogTitle className="text-sm font-medium tracking-wide text-white">ADMIN</DialogTitle>
              <DialogClose aria-label="关闭管理员导航" className="rounded-md p-2 text-neutral-300 hover:bg-white/10 hover:text-white">
                <X aria-hidden="true" className="size-5" />
              </DialogClose>
            </div>
            <AdminNavigation onNavigate={() => setMobileNavigationOpen(false)} />
            <div className="absolute right-4 bottom-4 left-4"><AdminAccount userName={userName} /></div>
          </DialogContent>
        </Dialog>
      </header>

      <main className="min-w-0 px-4 py-6 md:pl-[var(--admin-sidebar-width)] md:pr-6 md:py-8 lg:pr-8">
        {children}
      </main>
    </div>
  </AdminNavigationGuardProvider>;
}

function AdminBrand({ className }: { className: string }) {
  const handleNavigation = useGuardedNavigation();

  return <Link href="/dashboard" onClick={handleNavigation} className={className}>ADMIN</Link>;
}
