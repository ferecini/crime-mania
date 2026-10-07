"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { SearchIcon } from "@/components/member/SearchIcon";

export function MemberHeaderSearch({
  headerOffsetClass = "top-[3.75rem] md:top-[4.25rem]",
}: {
  headerOffsetClass?: string;
}) {
  const router = useRouter();
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const toggleId = `search-toggle-${inputId}`;

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
        document.getElementById(toggleId)?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, toggleId]);

  useEffect(() => {
    const onPointer = (e: MouseEvent) => {
      if (!open) return;
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/membro/busca?q=${encodeURIComponent(q)}`);
    setOpen(false);
  }

  const toggleClass =
    "inline-flex min-h-11 items-center justify-center rounded-[4px] border border-cm-divider text-sm font-semibold text-white transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2";

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        id={toggleId}
        type="button"
        aria-expanded={open}
        aria-controls={`member-search-${inputId}`}
        className={`${toggleClass} h-11 w-11 px-0 md:hidden`}
        onClick={() => setOpen((v) => !v)}
      >
        <SearchIcon className="h-5 w-5" />
        <span className="sr-only">Buscar casos e conteúdos</span>
      </button>

      <button
        type="button"
        aria-expanded={open}
        aria-controls={`member-search-${inputId}`}
        className={`${toggleClass} hidden gap-2 px-4 md:inline-flex`}
        onClick={() => setOpen((v) => !v)}
      >
        <SearchIcon className="h-5 w-5 shrink-0" />
        <span>Buscar</span>
      </button>

      {open && (
        <form
          id={`member-search-${inputId}`}
          onSubmit={submit}
          className={`fixed inset-x-0 z-50 border-b border-cm-divider bg-cm-bg p-4 shadow-xl ${headerOffsetClass} lg:absolute lg:inset-x-auto lg:right-0 lg:top-full lg:mt-2 lg:w-[min(24rem,calc(100vw-2rem))] lg:rounded-[4px] lg:border lg:p-3`}
        >
          <label htmlFor={`member-search-input-${inputId}`} className="sr-only">
            Buscar casos e conteúdos
          </label>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              id={`member-search-input-${inputId}`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar casos e conteúdos"
              className="cm-input min-h-11 min-w-0 flex-1"
              autoComplete="off"
            />
            <button
              type="submit"
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-[4px] bg-cm-red px-4 text-sm font-semibold text-white hover:bg-cm-red-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
            >
              Buscar
            </button>
          </div>
        </form>
      )}

      <div className="sr-only" aria-live="polite">
        {open ? "Campo de busca aberto. Pressione Escape para fechar." : ""}
      </div>

      <Link href="/membro/busca" className="sr-only">
        Ir para resultados de busca
      </Link>
    </div>
  );
}
