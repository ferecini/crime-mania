"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/membro", label: "Início" },
  { href: "/membro/dossies", label: "Dossiês" },
  { href: "/membro/arquivo", label: "Arquivo" },
  { href: "/membro/exclusivo", label: "Exclusivo" },
  { href: "/membro/juris", label: "Juris" },
  { href: "/membro/comunidade", label: "Comunidade" },
  { href: "/membro/shop", label: "Shop" },
  { href: "/membro/busca", label: "Busca" },
  { href: "/membro/planos", label: "Planos" },
  { href: "/membro/conta", label: "Minha conta" },
];

export function MemberNav({ layout = "sidebar" }: { layout?: "sidebar" | "rail" }) {
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
      {links.map((link) => {
        const active =
          pathname === link.href ||
          (link.href !== "/membro" && pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              isSidebar
                ? `rounded-md px-3 py-2.5 text-sm transition ${
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
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
