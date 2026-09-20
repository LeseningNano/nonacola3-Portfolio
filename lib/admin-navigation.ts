export const ADMIN_NAV_ITEMS = [
  { id: "works", label: "作品", href: "/dashboard/works" },
  { id: "news", label: "News", href: "/dashboard/news" },
  { id: "settings", label: "页面设置", href: "/dashboard/settings" },
  { id: "media", label: "媒体库", href: "/dashboard/media" },
] as const;

export type AdminNavItem = (typeof ADMIN_NAV_ITEMS)[number];

export function isAdminPath(pathname: string) {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/") ||
    pathname === "/videos/new" || /^\/videos\/[^/]+\/edit$/.test(pathname);
}

export function getActiveAdminItem(pathname: string): AdminNavItem["id"] | null {
  return ADMIN_NAV_ITEMS.find(({ href }) => pathname === href || pathname.startsWith(`${href}/`))?.id ?? null;
}
