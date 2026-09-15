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
