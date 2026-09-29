export interface PortfolioMenuPrimary {
  id: "home" | "works";
  label: "HOME" | "WORKS";
  href: "/" | "/works";
  direction: "back" | "forward";
}

export function getPortfolioMenuPrimary(pathname: string): PortfolioMenuPrimary {
  if (pathname === "/works" || pathname.startsWith("/works/")) {
    return { id: "home", label: "HOME", href: "/", direction: "back" };
  }

  return { id: "works", label: "WORKS", href: "/works", direction: "forward" };
}

// 首页与 works 索引页有开场动画：导航栏在动画结束（portfolio-intro-done）前隐藏。
// 其他路由没有开场动画，导航栏保持常驻。
export function shouldGateNavbarOnIntro(pathname: string): boolean {
  return pathname === "/" || pathname === "/works";
}

// 访问提示横幅只在首页（主屏）出现，切换页面即关闭。
export function shouldShowServerNotice(pathname: string): boolean {
  return pathname === "/";
}

function isAdminPath(href: string): boolean {
  const pathname = href.split(/[?#]/, 1)[0];
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/") || pathname === "/login";
}

export function shouldUseBlackTransition(from: string, to: string): boolean {
  return !isAdminPath(from) && !isAdminPath(to);
}

export type NavSectionId = "works" | "news" | "about";

export const NAV_SECTION_IDS: NavSectionId[] = ["works", "news", "about"];

// 桌面导航下划线的目标：/works 路由树固定在 WORKS；
// 首页取「上沿越过视口 40% 位置」的最后一个板块，仍在 Hero 时为 null（隐藏下划线）。
// 传入 scrollHeight 时，滚到页面底部即取最后一个存在的板块（最后一段较短时上沿到不了 40% 线）。
export function getActiveNavSection(
  pathname: string,
  sectionTops: Partial<Record<NavSectionId, number>>,
  scrollTop: number,
  viewportHeight: number,
  scrollHeight?: number
): NavSectionId | null {
  if (pathname === "/works" || pathname.startsWith("/works/")) return "works";
  if (pathname !== "/") return null;
  if (
    scrollHeight !== undefined &&
    scrollHeight > viewportHeight &&
    scrollTop + viewportHeight >= scrollHeight - 2
  ) {
    for (let i = NAV_SECTION_IDS.length - 1; i >= 0; i--) {
      if (sectionTops[NAV_SECTION_IDS[i]] !== undefined) return NAV_SECTION_IDS[i];
    }
  }
  const line = scrollTop + viewportHeight * 0.4;
  let active: NavSectionId | null = null;
  for (const id of NAV_SECTION_IDS) {
    const top = sectionTops[id];
    if (top !== undefined && top <= line) active = id;
  }
  return active;
}

export function getScrollProgress(scrollTop: number, scrollHeight: number, clientHeight: number): number {
  const max = scrollHeight - clientHeight;
  if (max <= 0) return 0;
  return Math.min(1, Math.max(0, scrollTop / max));
}

// 顶部 1px 滚动进度线只在首页与 works 索引页显示
export function shouldShowScrollProgress(pathname: string): boolean {
  return pathname === "/" || pathname === "/works";
}
