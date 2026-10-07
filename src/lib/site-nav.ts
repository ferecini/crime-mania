/** Links principais do site público (header e drawer). */
export const PUBLIC_SITE_NAV = [
  { href: "/#sobre", label: "Sobre", match: (p: string) => p === "/" },
  { href: "/shop", label: "Shop", match: (p: string) => p.startsWith("/shop") },
  { href: "/episodios", label: "Episódios", match: (p: string) => p.startsWith("/episodios") },
] as const;

export type PublicSiteNavItem = (typeof PUBLIC_SITE_NAV)[number];
