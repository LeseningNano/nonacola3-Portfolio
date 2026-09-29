export const ADMIN_NAV_ITEMS = [
  { id: "works", label: "作品", href: "/dashboard/works" },
  { id: "news", label: "News", href: "/dashboard/news" },
  { id: "settings", label: "页面媒体", href: "/dashboard/settings" },
  { id: "media", label: "媒体库", href: "/dashboard/media" },
] as const;

export type AdminNavItem = (typeof ADMIN_NAV_ITEMS)[number];

export const ADMIN_NAV_GROUPS = [
  { label: "内容", items: [ADMIN_NAV_ITEMS[0], ADMIN_NAV_ITEMS[1]] },
  { label: "网站", items: [ADMIN_NAV_ITEMS[2]] },
  { label: "资源", items: [ADMIN_NAV_ITEMS[3]] },
] as const;

type PreventableNavigationEvent = {
  preventDefault: () => void;
};

export function guardAdminAction(
  event: PreventableNavigationEvent,
  confirmNavigation?: () => boolean,
) {
  if (confirmNavigation && !confirmNavigation()) event.preventDefault();
}

export function isAdminPath(pathname: string) {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/") ||
    pathname === "/videos/new" || /^\/videos\/[^/]+\/edit$/.test(pathname);
}

export function getActiveAdminItem(pathname: string): AdminNavItem["id"] | null {
  return ADMIN_NAV_ITEMS.find(({ href }) => pathname === href || pathname.startsWith(`${href}/`))?.id ?? null;
}

export function formatAdminDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}
