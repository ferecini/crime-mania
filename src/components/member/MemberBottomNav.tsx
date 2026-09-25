"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/membro", label: "Início" },
  { href: "/membro/dossies", label: "Dossiês" },
  { href: "/membro/planos", label: "Planos" },
  { href: "/membro/comunidade", label: "Comunidade" },
  { href: "/membro/conta", label: "Conta" },
];

export function MemberBottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-cm-bg/95 backdrop-blur-xl lg:hidden"
      aria-label="Atalhos da área logada"
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/membro" && pathname.startsWith(item.href));
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
                  active ? "text-cm-red-light" : "text-cm-gray"
                }`}
              >
                <span className="sr-only">{item.label}</span>
                <span aria-hidden>{item.label.slice(0, 1)}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
