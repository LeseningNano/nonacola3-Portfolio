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
