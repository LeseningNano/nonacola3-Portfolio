"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { FormEvent, MouseEvent, ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { FolderKanban, Images, LogOut, Menu, Newspaper, PanelsTopLeft, X } from "lucide-react";
import { logoutAdmin } from "@/app/(admin)/dashboard/actions";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { installUnsavedAdminHistoryGuard, type UnsavedAdminHistoryGuard } from "@/lib/admin-history-guard";
import { ADMIN_NAV_GROUPS, getActiveAdminItem, guardAdminAction } from "@/lib/admin-navigation";

type AdminShellProps = {
  children: ReactNode;
  userName?: string | null;
};

type NavigationGuard = () => boolean;

const adminNavigationIcons = {
  works: FolderKanban,
  news: Newspaper,
  settings: PanelsTopLeft,
  media: Images,
} as const;

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

export function useAdminNavigationGuard(guard: NavigationGuard, isDirty = false): () => void {
  const context = useContext(AdminNavigationGuardContext);
  const historyGuardRef = useRef<UnsavedAdminHistoryGuard | null>(null);
  const allowNextHistoryPop = useCallback(() => historyGuardRef.current?.allowNextPop(), []);

  useEffect(() => context?.registerNavigationGuard(guard), [context, guard]);

  useEffect(() => {
    if (!isDirty) return;

    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const historyGuard = installUnsavedAdminHistoryGuard({
      history: window.history,
      target: window,
      href: window.location.href,
      currentHref: () => window.location.href,
      confirmLeave: guard,
    });
    historyGuardRef.current = historyGuard;
    window.addEventListener("beforeunload", warnBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", warnBeforeUnload);
      historyGuard.remove();
      if (historyGuardRef.current === historyGuard) historyGuardRef.current = null;
    };
  }, [guard, isDirty]);

  return allowNextHistoryPop;
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
    <nav aria-label="管理员导航" className="flex flex-col gap-5">
      {ADMIN_NAV_GROUPS.map((group) => (
        <section key={group.label} aria-label={group.label} className="flex flex-col gap-1">
          <h2 className="px-3 text-[10px] font-medium tracking-[0.14em] text-neutral-500">{group.label}</h2>
          {group.items.map((item) => {
            const Icon = adminNavigationIcons[item.id];
            const isActive = activeItem === item.id;

            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                onClick={handleNavigation}
                className={`flex min-h-10 items-center gap-2.5 rounded-md px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                  isActive
                    ? "bg-white/[0.08] text-white"
                    : "text-neutral-400 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                <Icon aria-hidden="true" className={`size-4 ${isActive ? "text-neutral-200" : "text-neutral-500"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </section>
      ))}
    </nav>
  );
}

function AdminAccount({ userName }: { userName?: string | null }) {
  const context = useContext(AdminNavigationGuardContext);
  const handleNavigation = useGuardedNavigation();
  const handleSignOut = useCallback((event: FormEvent<HTMLFormElement>) => {
    guardAdminAction(event, context?.confirmNavigation);
  }, [context]);

  return (
    <div className="border-t border-white/10 pt-4">
      {userName ? <p className="mb-3 truncate px-3 text-sm text-neutral-400">{userName}</p> : null}
      <Link href="/" onClick={handleNavigation} className="flex min-h-10 items-center rounded-md px-3 py-2 text-sm text-neutral-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
        查看网站
      </Link>
      <form action={logoutAdmin} onSubmit={handleSignOut}>
        <button type="submit" className="flex min-h-10 w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-neutral-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
          <LogOut aria-hidden="true" className="size-4" />
          退出登录
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
        <AdminBrand className="mb-8 px-2" />
        <AdminNavigation />
        <div className="mt-auto"><AdminAccount userName={userName} /></div>
      </aside>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-white/10 bg-[#0a0a0a]/95 px-4 backdrop-blur md:hidden">
        <AdminBrand />
        <Dialog open={mobileNavigationOpen} onOpenChange={handleMobileNavigationChange}>
          <DialogTrigger
            ref={triggerRef}
            aria-label="打开管理员导航"
            className="min-h-10 min-w-10 rounded-md p-2 text-neutral-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <Menu aria-hidden="true" className="size-5" />
          </DialogTrigger>
          <DialogContent showCloseButton={false} className="inset-y-0 left-0 h-dvh w-[min(20rem,calc(100%-3rem))] max-w-none translate-x-0 translate-y-0 rounded-none border-r border-white/10 bg-[#0a0a0a] p-4 text-white sm:max-w-none">
            <div className="mb-8 flex items-center justify-between">
              <DialogTitle className="text-sm font-medium tracking-wide text-white">管理菜单</DialogTitle>
              <DialogClose aria-label="关闭管理员导航" className="min-h-10 min-w-10 rounded-md p-2 text-neutral-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                <X aria-hidden="true" className="size-5" />
              </DialogClose>
            </div>
            <AdminNavigation onNavigate={() => setMobileNavigationOpen(false)} />
            <div className="absolute right-4 bottom-4 left-4"><AdminAccount userName={userName} /></div>
          </DialogContent>
        </Dialog>
      </header>

      <main className="min-w-0 px-4 py-6 md:ml-[var(--admin-sidebar-width)] md:px-6 md:py-8 lg:px-8">
        {children}
      </main>
    </div>
  </AdminNavigationGuardProvider>;
}

function AdminBrand({ className = "" }: { className?: string }) {
  const handleNavigation = useGuardedNavigation();

  return (
    <Link
      href="/dashboard"
      onClick={handleNavigation}
      aria-label="N3 Portfolio 管理首页"
      className={`inline-flex min-h-10 items-center gap-2.5 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${className}`}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-md border border-white/15 bg-white/[0.04] text-xs font-semibold tracking-tight">N3</span>
      <span className="min-w-0">
        <span className="block text-sm font-medium tracking-wide">Portfolio</span>
        <span className="block text-[10px] tracking-[0.12em] text-neutral-500">管理后台</span>
      </span>
    </Link>
  );
}
