"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GalleryItemPublic } from "@/lib/gallery/types";

function imageSrc(slug: string, id: string) {
  return `/api/dossier/${encodeURIComponent(slug)}/gallery/${encodeURIComponent(id)}`;
}

const ILLUSTRATIVE_LABEL = "Imagem ilustrativa para demonstração";

export function DossierGalleryCarousel({ slug }: { slug: string }) {
  const [items, setItems] = useState<GalleryItemPublic[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "empty" | "blocked" | "error">("loading");
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const touchStartX = useRef<number | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/dossier/${encodeURIComponent(slug)}/gallery/manifest`, {
          credentials: "include",
        });
        if (res.status === 403) {
          if (!cancelled) setState("blocked");
          return;
        }
        if (!res.ok) {
          if (!cancelled) setState("empty");
          return;
        }
        const data = (await res.json()) as { items: GalleryItemPublic[] };
        const sorted = (data.items ?? []).slice().sort((a, b) => a.order - b.order);
        if (!cancelled) {
          setItems(sorted);
          setState(sorted.length ? "ready" : "empty");
        }
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const go = useCallback(
    (delta: number) => {
      if (!items.length) return;
      setIndex((i) => (i + delta + items.length) % items.length);
      setLoadError(null);
    },
    [items.length],
  );

  useEffect(() => {
    if (!lightbox) return;
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "Escape") setLightbox(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, go]);

  if (state === "loading") {
    return (
      <section className="rounded-[4px] border border-cm-divider p-8 text-center" aria-busy="true">
        <h2 className="font-display text-lg text-white">Galeria</h2>
        <p className="mt-2 text-sm text-cm-gray">Carregando…</p>
      </section>
    );
  }

  if (state === "blocked" || state === "empty" || state === "error" || !items.length) {
    return (
      <section className="rounded-[4px] border border-dashed border-cm-divider p-8 text-center">
        <h2 className="font-display text-lg text-white">Galeria</h2>
        <p className="mt-2 text-sm text-cm-gray">
          {state === "blocked" ? "Conteúdo reservado a assinantes." : "Galeria em preparação."}
        </p>
      </section>
    );
  }

  const current = items[index];
  const prev = items[(index - 1 + items.length) % items.length];
  const next = items[(index + 1) % items.length];

  return (
    <section className="max-w-full space-y-3 overflow-x-hidden md:space-y-4" aria-label="Galeria do caso">
      <h2 className="font-display text-lg text-white">Galeria</h2>

      {/* Mobile: full-width slide, arrows overlaid */}
      <div
        className="relative md:hidden"
        onTouchStart={(e) => {
          touchStartX.current = e.changedTouches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const start = touchStartX.current;
          touchStartX.current = null;
          if (start == null) return;
          const end = e.changedTouches[0]?.clientX ?? start;
          const delta = end - start;
          if (Math.abs(delta) < 40) return;
          go(delta > 0 ? -1 : 1);
        }}
      >
        <button
          type="button"
          onClick={() => setLightbox(true)}
          className="relative block w-full max-w-[calc(100vw-2rem)] overflow-hidden rounded-[4px] border border-cm-divider bg-black/20"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc(slug, current.id)}
            alt={current.alt}
            className="mx-auto block h-auto max-h-[min(70vh,520px)] w-full max-w-full object-contain"
            draggable={false}
            onError={() => setLoadError("Não foi possível carregar esta imagem.")}
          />
        </button>
        <button
          type="button"
          onClick={() => go(-1)}
          className="absolute left-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/55 text-lg text-white backdrop-blur-sm"
          aria-label="Imagem anterior"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/55 text-lg text-white backdrop-blur-sm"
          aria-label="Próxima imagem"
        >
          →
        </button>
      </div>

      {/* Desktop: main ~80% width, optional neighbor previews */}
      <div
        className="relative hidden md:flex md:items-center md:justify-center md:gap-3"
        onTouchStart={(e) => {
          touchStartX.current = e.changedTouches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const start = touchStartX.current;
          touchStartX.current = null;
          if (start == null) return;
          const end = e.changedTouches[0]?.clientX ?? start;
          const delta = end - start;
          if (Math.abs(delta) < 40) return;
          go(delta > 0 ? -1 : 1);
        }}
      >
        <button
          type="button"
          onClick={() => go(-1)}
          className="inline-flex h-11 min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-cm-divider text-white hover:bg-white/5"
          aria-label="Imagem anterior"
        >
          ←
        </button>
        <div className="flex min-w-0 flex-1 items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => go(-1)}
            className="relative hidden aspect-[4/5] w-[12%] max-w-[7rem] shrink-0 overflow-hidden rounded opacity-50 lg:block"
            aria-hidden
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageSrc(slug, prev.id)} alt="" className="h-full w-full object-cover" />
          </button>
          <button
            type="button"
            onClick={() => setLightbox(true)}
            className="relative min-w-0 flex-[1_1_80%] overflow-hidden rounded-[4px] border border-cm-divider bg-black/20"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc(slug, current.id)}
              alt={current.alt}
              className="mx-auto block max-h-[70vh] w-full max-w-full object-contain"
              draggable={false}
              onError={() => setLoadError("Não foi possível carregar esta imagem.")}
            />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="relative hidden aspect-[4/5] w-[12%] max-w-[7rem] shrink-0 overflow-hidden rounded opacity-50 lg:block"
            aria-hidden
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageSrc(slug, next.id)} alt="" className="h-full w-full object-cover" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          className="inline-flex h-11 min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-cm-divider text-white hover:bg-white/5"
          aria-label="Próxima imagem"
        >
          →
        </button>
      </div>

      <div className="space-y-1 text-sm">
        {current.isIllustrative && (
          <p className="font-medium text-amber-200/90">{ILLUSTRATIVE_LABEL}</p>
        )}
        <p className="text-white">{current.caption}</p>
        {current.credit && <p className="text-cm-gray">Crédito: {current.credit}</p>}
        {loadError && (
          <p className="text-cm-red-light" role="alert">
            {loadError}
          </p>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-2.5" role="tablist" aria-label="Indicadores da galeria">
        {items.map((img, i) => (
          <button
            key={img.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Imagem ${i + 1}`}
            onClick={() => {
              setIndex(i);
              setLoadError(null);
            }}
            className="flex h-11 min-w-11 items-center justify-center rounded-full p-0"
          >
            <span
              className={`block rounded-full transition-colors ${
                i === index ? "h-2.5 w-2.5 bg-cm-red" : "h-2 w-2 bg-white/35"
              }`}
            />
          </button>
        ))}
      </div>
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Visualização ampliada"
        >
          <button
            ref={closeBtnRef}
            type="button"
            className="absolute right-4 top-4 flex min-h-11 min-w-11 items-center justify-center rounded border border-white/20 px-3 text-white"
            onClick={() => setLightbox(false)}
          >
            Fechar
          </button>
          <div className="max-h-[75vh] w-full max-w-3xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc(slug, current.id)}
              alt={current.alt}
              className="mx-auto max-h-[75vh] w-auto max-w-full object-contain"
            />
          </div>
          <div className="mt-4 max-w-lg px-4 text-center text-sm">
            {current.isIllustrative && (
              <p className="mb-2 font-medium text-amber-200/90">{ILLUSTRATIVE_LABEL}</p>
            )}
            <p className="text-white">{current.caption}</p>
          </div>
        </div>
      )}
    </section>
  );
}
