"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MemberHeaderSearch } from "@/components/member/MemberHeaderSearch";
import { LogoutButton } from "@/components/member/LogoutButton";
import { PUBLIC_SITE_NAV } from "@/lib/site-nav";

export function MemberAreaHeader({ displayName }: { displayName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

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
    <header className="fixed inset-x-0 top-0 z-50 border-b border-cm-divider bg-black/92 backdrop-blur-md">
      <div className="cm-container flex h-[3.75rem] items-center gap-3 md:h-[4.25rem] md:gap-6">
        <button
          ref={menuButtonRef}
          type="button"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[4px] border border-cm-divider text-white md:hidden"
          aria-expanded={open}
          aria-controls="member-mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{open ? "Fechar menu" : "Abrir menu"}</span>
          <span className="flex flex-col gap-1.5" aria-hidden>
            <span className={`block h-0.5 w-5 bg-white transition ${open ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`block h-0.5 w-5 bg-white transition ${open ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-5 bg-white transition ${open ? "-translate-y-2 -rotate-45" : ""}`} />
          </span>
        </button>

        <Link
          href="/"
          className="relative h-[34px] w-[5.25rem] shrink-0 opacity-95 hover:opacity-100 md:h-11 md:w-[6.5rem]"
        >
          <Image
            src="/logo-crime-mania.jpg"
            alt="Crime Mania"
            fill
            className="object-contain object-left"
            priority
          />
        </Link>

        <nav
          className="hidden min-w-0 flex-1 items-center gap-4 md:flex lg:gap-8 xl:gap-10"
          aria-label="Principal"
        >
          {PUBLIC_SITE_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="cm-nav-link whitespace-nowrap"
              data-active={item.match(pathname) ? "true" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3 md:gap-4 lg:gap-5">
          <MemberHeaderSearch headerOffsetClass="top-[3.75rem] md:top-[4.25rem]" />
          <Link
            href="/membro/conta"
            className="cm-text-link hidden max-w-[10rem] truncate text-sm text-cm-gray hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 sm:inline sm:max-w-[12rem] md:max-w-[14rem]"
          >
            Olá, <span className="font-medium text-white">{displayName}</span>
          </Link>
          <Link
            href="/membro/conta"
            className="cm-text-link inline-flex min-h-11 min-w-11 items-center justify-center rounded-[4px] border border-transparent px-2 text-sm font-semibold text-cm-gray hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 sm:hidden"
          >
            <span className="sr-only">Minha conta — {displayName}</span>
            <span aria-hidden className="font-medium text-white">
              Conta
            </span>
          </Link>
          <LogoutButton className="inline-flex min-h-11 items-center px-1 text-sm font-semibold text-cm-gray hover:text-white" />
        </div>
      </div>

      <div
        id="member-mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={`fixed inset-0 top-[3.75rem] z-40 bg-black/98 px-[1.125rem] pb-8 pt-4 transition md:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <nav className="flex flex-col gap-1" aria-label="Mobile">
          {PUBLIC_SITE_NAV.map((item, i) => (
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
        </nav>
      </div>
    </header>
  );
}
