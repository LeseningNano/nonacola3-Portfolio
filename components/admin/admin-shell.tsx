"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { FormEvent, MouseEvent, ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Clapperboard, ExternalLink, Images, LogOut, Menu, Newspaper, PanelsTopLeft, X } from "lucide-react";
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
  works: Clapperboard,
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

export function useAdminNavigationGuard(guard: NavigationGuard, isDirty = false) {
  const context = useContext(AdminNavigationGuardContext);
  const historyGuardRef = useRef<UnsavedAdminHistoryGuard | null>(null);
  const allowNextHistoryPop = useCallback(() => historyGuardRef.current?.allowNextPop(), []);
  const navigateAfterRelease = useCallback((navigate: () => void) => {
    const historyGuard = historyGuardRef.current;
    if (historyGuard) historyGuard.navigateAfterRelease(navigate);
    else navigate();
  }, []);

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

  return { allowNextHistoryPop, navigateAfterRelease };
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

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent";
const iconButtonClass = `grid size-8 shrink-0 place-items-center rounded-sm text-admin-fg-3 transition-colors hover:bg-admin-raised hover:text-admin-fg ${focusRing}`;

function AdminNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const activeItem = getActiveAdminItem(pathname);
  const handleNavigation = useGuardedNavigation(onNavigate);
  return (
    <nav aria-label="管理员导航" className="flex flex-col gap-4">
      {ADMIN_NAV_GROUPS.map((group) => (
        <section key={group.label} aria-label={group.label} className="flex flex-col gap-0.5">
          <h2 className="mb-1 px-2.5 text-xs text-admin-fg-3">{group.label}</h2>
          {group.items.map((item) => {
            const Icon = adminNavigationIcons[item.id];
            const isActive = activeItem === item.id;

            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                onClick={handleNavigation}
                className={`flex h-[34px] items-center gap-2.5 rounded-sm px-2.5 text-[13px] transition-colors ${focusRing} ${
                  isActive
                    ? "bg-admin-selected text-white shadow-[inset_2px_0_0_var(--admin-accent)]"
                    : "text-admin-fg-2 hover:bg-admin-raised hover:text-admin-fg"
                }`}
              >
                <Icon aria-hidden="true" className={`size-4 ${isActive ? "text-admin-fg" : "text-admin-fg-3"}`} />
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
  const name = userName?.trim() || "Admin";

  return (
    <div className="flex items-center gap-2 border-t border-admin-line px-1 pt-3">
      <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-sm bg-admin-selected text-xs text-admin-fg">{name[0]?.toUpperCase()}</span>
      <span className="min-w-0 flex-1 truncate text-[13px] text-admin-fg">{name}</span>
      <Link href="/" onClick={handleNavigation} aria-label="查看网站" title="查看网站" className={iconButtonClass}>
        <ExternalLink aria-hidden="true" className="size-4" />
      </Link>
      <form action={logoutAdmin} onSubmit={handleSignOut}>
        <button type="submit" aria-label="退出登录" title="退出登录" className={iconButtonClass}>
          <LogOut aria-hidden="true" className="size-4" />
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
    <div data-admin-theme className="min-h-screen bg-admin-canvas text-admin-fg [--admin-sidebar-width:12.5rem]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[var(--admin-sidebar-width)] flex-col border-r border-admin-line bg-admin-panel px-2.5 py-4 md:flex">
        <AdminBrand className="mb-7 px-2.5" />
        <AdminNavigation />
        <div className="mt-auto"><AdminAccount userName={userName} /></div>
      </aside>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-admin-line bg-admin-panel/95 px-4 backdrop-blur md:hidden">
        <AdminBrand />
        <Dialog open={mobileNavigationOpen} onOpenChange={handleMobileNavigationChange}>
          <DialogTrigger
            ref={triggerRef}
            aria-label="打开管理员导航"
            className={`grid size-10 place-items-center rounded-sm text-admin-fg-2 transition-colors hover:bg-admin-raised hover:text-admin-fg ${focusRing}`}
          >
            <Menu aria-hidden="true" className="size-5" />
          </DialogTrigger>
          <DialogContent showCloseButton={false} className="inset-y-0 left-0 h-dvh w-[min(20rem,calc(100%-3rem))] max-w-none translate-x-0 translate-y-0 rounded-none border-r border-admin-line bg-admin-panel px-2.5 py-4 text-admin-fg ring-0 sm:max-w-none">
            <div className="mb-7 flex items-center justify-between px-2.5">
              <DialogTitle className="font-pixel text-[1.2rem] leading-none text-white">nonacola3</DialogTitle>
              <DialogClose aria-label="关闭管理员导航" className={`grid size-10 place-items-center rounded-sm text-admin-fg-2 transition-colors hover:bg-admin-raised hover:text-admin-fg ${focusRing}`}>
                <X aria-hidden="true" className="size-5" />
              </DialogClose>
            </div>
            <AdminNavigation onNavigate={() => setMobileNavigationOpen(false)} />
            <div className="absolute right-2.5 bottom-4 left-2.5"><AdminAccount userName={userName} /></div>
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
      aria-label="nonacola3 管理后台首页"
      className={`inline-flex min-h-10 flex-col justify-center rounded-sm ${focusRing} ${className}`}
    >
      <span className="block font-pixel text-[1.2rem] leading-none text-white">nonacola3</span>
      <span className="mt-1 block text-xs text-admin-fg-3">管理后台</span>
    </Link>
  );
}
