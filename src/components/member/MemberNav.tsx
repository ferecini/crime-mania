"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  shortLabel?: string;
  description?: string;
  group?: "comunidade";
};

const links: NavItem[] = [
  { href: "/membro", label: "Início" },
  {
    href: "/membro/episodios",
    label: "Episódios",
    description: "Episódios para você",
  },
  {
    href: "/membro/dossies",
    label: "Dossiês",
    description: "Informação, fatos e fotos.",
  },
  {
    href: "/membro/juris",
    label: "Crime Mania Juris",
    shortLabel: "CM Juris",
  },
  {
    href: "/membro/comunidade",
    label: "Comunidade",
    description:
      "Espaço exclusivo para debater casos, crimes e tudo sobre o universo do true crime",
  },
  { href: "/membro/comunidade/forum", label: "Fórum da comunidade", group: "comunidade" },
  { href: "/membro/comunidade/sugira", label: "Sugira um episódio", group: "comunidade" },
  {
    href: "/membro/arquivo",
    label: "Arquivo",
    description: "Explore nosso acervo privado de episódios",
  },
  { href: "/membro/shop", label: "Shop" },
  { href: "/membro/conta", label: "Minha conta" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/membro") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MemberNav({
  layout = "sidebar",
  showAdmin = false,
}: {
  layout?: "sidebar" | "rail";
  showAdmin?: boolean;
}) {
  const pathname = usePathname();
  const isSidebar = layout === "sidebar";

  return (
    <nav
      className={
        isSidebar
          ? "flex flex-col gap-1"
          : "flex gap-2 overflow-x-auto pb-1 text-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      }
      aria-label="Área de membros"
    >
      {showAdmin && (
        <Link
          href="/membro/admin"
          className={
            isSidebar
              ? `rounded-md px-3 py-2.5 font-semibold text-cm-red-light ring-1 ring-cm-red/30`
              : `whitespace-nowrap rounded-full border border-cm-red/40 px-3 py-1.5 text-cm-red-light`
          }
        >
          Administração
        </Link>
      )}
      {links.map((link) => {
        const active = isActive(pathname, link.href);
        const label =
          !isSidebar && link.shortLabel && link.label === "Crime Mania Juris"
            ? link.shortLabel
            : link.label;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              isSidebar
                ? `rounded-md px-3 py-2.5 transition ${
                    link.group === "comunidade" ? "ml-3 border-l border-white/10 pl-4" : ""
                  } ${
                    active
                      ? "bg-cm-red/15 font-semibold text-white ring-1 ring-cm-red/30"
                      : "text-cm-gray hover:bg-white/5 hover:text-white"
                  }`
                : `whitespace-nowrap rounded-full border px-3 py-1.5 transition ${
                    active
                      ? "border-cm-red bg-cm-red/10 text-white"
                      : "border-white/10 text-cm-gray hover:text-white"
                  }`
            }
          >
            <span className="block text-sm">{label}</span>
            {isSidebar && link.description && (
              <span className="mt-0.5 block text-xs leading-snug text-cm-gray">{link.description}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
