"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";

const NAV = [
  { href: "/#sobre", label: "Sobre" },
  { href: "/shop", label: "Shop" },
  { href: "/episodios", label: "Episódios" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled || open
          ? "border-b border-cm-gray-dark/80 bg-cm-bg/95 backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <div className="cm-container flex h-16 items-center justify-between gap-4 px-5 lg:h-[4.5rem] lg:px-8">
        <nav className="hidden items-center gap-8 md:flex md:flex-1" aria-label="Principal">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-cm-gray transition-colors hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-6 md:flex">
          <ButtonLink href="/entrar" className="min-w-[7rem]">
            Entrar
          </ButtonLink>
          <Link href="/#top" className="relative h-10 w-28 shrink-0 lg:h-11 lg:w-32">
            <Image
              src="/logo-crime-mania.jpg"
              alt="Crime Mania"
              fill
              className="object-contain object-right"
              priority
            />
          </Link>
        </div>

        <Link
          href="/#top"
          className="relative ml-auto h-10 w-28 shrink-0 md:hidden"
        >
          <Image
            src="/logo-crime-mania.jpg"
            alt="Crime Mania"
            fill
            className="object-contain object-right"
            priority
          />
        </Link>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-sm border border-cm-gray-dark text-white md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{open ? "Fechar menu" : "Abrir menu"}</span>
          <span className="flex flex-col gap-1.5" aria-hidden>
            <span
              className={`block h-0.5 w-5 bg-white transition-transform ${open ? "translate-y-2 rotate-45" : ""}`}
            />
            <span
              className={`block h-0.5 w-5 bg-white transition-opacity ${open ? "opacity-0" : ""}`}
            />
            <span
              className={`block h-0.5 w-5 bg-white transition-transform ${open ? "-translate-y-2 -rotate-45" : ""}`}
            />
          </span>
        </button>
      </div>

      <div
        id="mobile-menu"
        className={`fixed inset-0 top-16 z-40 bg-cm-bg/98 px-5 pb-8 pt-6 transition md:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <nav className="flex flex-col gap-1" aria-label="Mobile">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-sm border-b border-cm-gray-dark/50 py-4 text-lg font-medium text-white"
            >
              {item.label}
            </Link>
          ))}
          <ButtonLink href="/entrar" className="mt-6 w-full text-center">
            Entrar
          </ButtonLink>
        </nav>
      </div>
    </header>
  );
}
