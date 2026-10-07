"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import {
  NavIconAccount,
  NavIconAdmin,
  NavIconArchive,
  NavIconCommunity,
  NavIconDossier,
  NavIconEpisodes,
  NavIconForum,
  NavIconHome,
  NavIconJuris,
  NavIconShop,
  NavIconSuggest,
} from "@/components/member/MemberNavIcons";

type NavItem = {
  href: string;
  label: string;
  shortLabel?: string;
  group?: "comunidade";
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const links: NavItem[] = [
  { href: "/membro", label: "Início", Icon: NavIconHome },
  { href: "/membro/episodios", label: "Episódios", Icon: NavIconEpisodes },
  { href: "/membro/dossies", label: "Dossiês", Icon: NavIconDossier },
  {
    href: "/membro/juris",
    label: "Crime Mania Juris",
    shortLabel: "CM Juris",
    Icon: NavIconJuris,
  },
  { href: "/membro/comunidade", label: "Comunidade", Icon: NavIconCommunity },
  { href: "/membro/comunidade/forum", label: "Fórum", group: "comunidade", Icon: NavIconForum },
  {
    href: "/membro/comunidade/sugira",
    label: "Sugira um episódio",
    group: "comunidade",
    Icon: NavIconSuggest,
  },
  { href: "/membro/arquivo", label: "Arquivo", Icon: NavIconArchive },
  { href: "/membro/shop", label: "Shop", Icon: NavIconShop },
  { href: "/membro/conta", label: "Minha conta", Icon: NavIconAccount },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/membro") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MemberNav({
  layout = "sidebar",
  showAdmin = false,
  collapsed = false,
}: {
  layout?: "sidebar" | "rail";
  showAdmin?: boolean;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const isSidebar = layout === "sidebar";

  return (
    <nav
      className={
        isSidebar
          ? "flex flex-col gap-0.5"
          : "flex gap-2 overflow-x-auto pb-1 text-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      }
      aria-label="Área de membros"
    >
      {showAdmin && (
        <Link
          href="/membro/admin"
          title={collapsed ? "Administração" : undefined}
          aria-label={collapsed ? "Administração" : undefined}
          className={
            isSidebar
              ? `flex items-center gap-3 rounded-md px-2.5 py-2.5 font-semibold text-cm-red-light ring-1 ring-cm-red/30 transition ${
                  collapsed ? "justify-center" : ""
                }`
              : `whitespace-nowrap rounded-full border border-cm-red/40 px-3 py-1.5 text-cm-red-light`
          }
        >
          <NavIconAdmin className="h-5 w-5 shrink-0" />
          {isSidebar && !collapsed && <span className="text-sm">Administração</span>}
          {isSidebar && collapsed && <span className="sr-only">Administração</span>}
        </Link>
      )}
      {links.map((link) => {
        const active = isActive(pathname, link.href);
        const label =
          !isSidebar && link.shortLabel && link.label === "Crime Mania Juris"
            ? link.shortLabel
            : link.label;
        const sidebarLabel = link.label;
        const Icon = link.Icon;

        if (!isSidebar) {
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 transition ${
                active
                  ? "border-cm-red bg-cm-red/10 text-white"
                  : "border-white/10 text-cm-gray hover:text-white"
              }`}
            >
              <span className="text-sm">{label}</span>
            </Link>
          );
        }

        return (
          <Link
            key={link.href}
            href={link.href}
            title={collapsed ? link.label : undefined}
            aria-label={collapsed ? link.label : undefined}
            className={`flex items-center gap-3 rounded-md px-2.5 py-2.5 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 ${
              link.group === "comunidade" && !collapsed ? "ml-2 border-l border-white/10 pl-3" : ""
            } ${collapsed ? "justify-center" : ""} ${
              active
                ? "bg-cm-red/15 font-semibold text-white ring-1 ring-cm-red/30"
                : "text-cm-gray hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && (
              <span className="min-w-0 truncate leading-snug">{sidebarLabel}</span>
            )}
            {collapsed && <span className="sr-only">{link.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
