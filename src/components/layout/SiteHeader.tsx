"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";

const NAV = [
  { href: "/#sobre", label: "Sobre" },
  { href: "/shop", label: "Shop" },
  { href: "/episodios", label: "Episódios" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
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

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled || open
          ? "border-b border-white/5 bg-cm-bg/90 backdrop-blur-xl"
          : "bg-gradient-to-b from-black/80 to-transparent"
      }`}
    >
      <div className="cm-container flex h-14 items-center justify-between gap-3 px-5 lg:h-16 lg:px-8">
        <button
          ref={menuButtonRef}
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/10 text-white md:hidden"
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

        <nav className="hidden items-center gap-8 md:flex md:flex-1" aria-label="Principal">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-cm-gray transition hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-5 md:flex">
          <ButtonLink href="/entrar" className="min-w-[6.5rem] px-5">
            Entrar
          </ButtonLink>
          <Link href="/#top" className="relative h-8 w-[4.5rem] shrink-0 opacity-95 hover:opacity-100">
            <Image
              src="/logo-crime-mania.jpg"
              alt="Crime Mania"
              fill
              className="object-contain object-right"
              priority
            />
          </Link>
        </div>

        <Link href="/#top" className="relative ml-auto h-7 w-16 shrink-0 md:hidden">
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
        className={`fixed inset-0 top-14 z-40 bg-cm-bg/98 px-5 pb-8 pt-4 transition md:hidden ${
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
              className="min-h-12 rounded-md border-b border-white/5 py-3 text-lg font-medium text-white"
            >
              {item.label}
            </Link>
          ))}
          <ButtonLink href="/entrar" className="mt-6 w-full text-center" onClick={() => setOpen(false)}>
            Entrar
          </ButtonLink>
        </nav>
      </div>
    </header>
  );
}
