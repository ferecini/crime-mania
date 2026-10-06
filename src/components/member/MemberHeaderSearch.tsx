"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

export function MemberHeaderSearch() {
  const router = useRouter();
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
        document.getElementById(`search-toggle-${inputId}`)?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, inputId]);

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

  return (
    <div ref={containerRef} className="relative w-full lg:w-auto">
      <button
        id={`search-toggle-${inputId}`}
        type="button"
        aria-expanded={open}
        aria-controls={`member-search-${inputId}`}
        className="inline-flex h-11 min-w-11 items-center justify-center rounded-[4px] border border-cm-divider px-3 text-sm text-white hover:bg-white/5"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="sr-only">Buscar casos e conteúdos</span>
        <span aria-hidden>⌕</span>
      </button>

      {open && (
        <form
          id={`member-search-${inputId}`}
          onSubmit={submit}
          className="fixed inset-x-0 top-[4.5rem] z-50 border-b border-cm-divider bg-cm-bg p-4 lg:absolute lg:inset-x-auto lg:right-0 lg:top-1/2 lg:mt-0 lg:w-80 lg:-translate-y-1/2 lg:rounded-[4px] lg:border lg:p-2 lg:shadow-xl"
        >
          <label htmlFor={`member-search-input-${inputId}`} className="sr-only">
            Buscar casos e conteúdos
          </label>
          <input
            ref={inputRef}
            id={`member-search-input-${inputId}`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar casos e conteúdos"
            className="cm-input w-full"
            autoComplete="off"
          />
        </form>
      )}

      <div className="sr-only" aria-live="polite">
        {open ? "Campo de busca aberto" : ""}
      </div>

      <Link href="/membro/busca" className="sr-only">
        Ir para resultados de busca
      </Link>
    </div>
  );
}
