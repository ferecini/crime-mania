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
  { href: "/membro/conta", label: "Minha conta" },
  { href: "/membro/planos", label: "Planos" },
];

export function MemberNav() {
  const pathname = usePathname();
  return (
    <nav
      className="flex gap-2 overflow-x-auto pb-1 text-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
            className={`whitespace-nowrap rounded-sm border px-3 py-1.5 transition-colors ${
              active
                ? "border-cm-red bg-cm-red/10 text-white"
                : "border-cm-gray-dark text-cm-gray hover:text-white"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
