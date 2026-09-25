"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";

const NAV = [
  { href: "/#sobre", label: "Sobre", match: (p: string) => p === "/" },
  { href: "/shop", label: "Shop", match: (p: string) => p.startsWith("/shop") },
  { href: "/episodios", label: "Episódios", match: (p: string) => p.startsWith("/episodios") },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const onHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (open) firstLinkRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const headerBg =
    open || scrolled || !onHome
      ? "border-b border-cm-divider bg-black/92 backdrop-blur-md"
      : "bg-transparent";

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-[background,border] duration-300 ${headerBg}`}>
      <div className="cm-container flex h-[3.75rem] items-center justify-between gap-3 md:h-[4.25rem]">
        <button
          ref={menuButtonRef}
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-[4px] border border-cm-divider text-white md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{open ? "Fechar menu" : "Abrir menu"}</span>
          <span className="flex flex-col gap-1.5" aria-hidden>
            <span className={`block h-0.5 w-5 bg-white transition ${open ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`block h-0.5 w-5 bg-white transition ${open ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-5 bg-white transition ${open ? "-translate-y-2 -rotate-45" : ""}`} />
          </span>
        </button>

        <nav className="hidden items-center gap-10 md:flex md:flex-1" aria-label="Principal">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="cm-nav-link"
              data-active={item.match(pathname) ? "true" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-6 md:flex">
          <Link href="/entrar" className="cm-text-link text-sm font-semibold text-cm-gray hover:text-white">
            Entrar
          </Link>
          <ButtonLink href="/membro/planos" className="min-w-[7.5rem]">
            Faça parte
          </ButtonLink>
          <Link href="/#top" className="relative h-10 w-[5.5rem] shrink-0 opacity-95 hover:opacity-100 md:h-11 md:w-[6.25rem]">
            <Image
              src="/logo-crime-mania.jpg"
              alt="Crime Mania"
              fill
              className="object-contain object-right"
              priority
            />
          </Link>
        </div>

        <Link href="/#top" className="relative ml-auto h-[34px] w-[4.75rem] shrink-0 md:hidden">
          <Image
            src="/logo-crime-mania.jpg"
            alt="Crime Mania"
            fill
            className="object-contain object-right"
            priority
          />
        </Link>
      </div>

      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={`fixed inset-0 top-[3.75rem] z-40 bg-black/98 px-[1.125rem] pb-8 pt-4 transition md:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <nav className="flex flex-col gap-1" aria-label="Mobile">
          {NAV.map((item, i) => (
            <Link
              key={item.href}
              ref={i === 0 ? firstLinkRef : undefined}
              href={item.href}
              onClick={() => {
                setOpen(false);
                menuButtonRef.current?.focus();
              }}
              className="min-h-12 border-b border-cm-divider py-3 text-lg font-medium text-white"
            >
              {item.label}
            </Link>
          ))}
          <ButtonLink href="/membro/planos" className="mt-6 w-full text-center" onClick={() => setOpen(false)}>
            Faça parte
          </ButtonLink>
          <Link
            href="/entrar"
            onClick={() => setOpen(false)}
            className="cm-text-link mt-4 inline-flex min-h-12 items-center justify-center text-sm font-semibold"
          >
            Entrar →
          </Link>
        </nav>
      </div>
    </header>
  );
}
