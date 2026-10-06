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
    <section className="max-w-full space-y-4 overflow-x-hidden" aria-label="Galeria do caso">
      <h2 className="font-display text-lg text-white">Galeria</h2>
      <div
        className="relative flex max-w-full items-center justify-center gap-1 sm:gap-2 md:gap-4"
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
        <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,0.55fr)_minmax(0,1.45fr)_minmax(0,0.55fr)] items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => go(-1)}
            className="relative hidden aspect-[4/5] min-w-0 overflow-hidden rounded opacity-60 md:block"
            aria-hidden
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageSrc(slug, prev.id)} alt="" className="h-full w-full object-cover" />
          </button>
          <button
            type="button"
            onClick={() => setLightbox(true)}
            className="relative aspect-[4/5] w-full min-w-0 overflow-hidden rounded-[4px] border border-cm-divider"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc(slug, current.id)}
              alt={current.alt}
              className="h-full w-full object-contain bg-black/20"
              draggable={false}
              onError={() => setLoadError("Não foi possível carregar esta imagem.")}
            />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="relative hidden aspect-[4/5] min-w-0 overflow-hidden rounded opacity-60 md:block"
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
      <div className="flex flex-wrap justify-center gap-2" role="tablist" aria-label="Indicadores da galeria">
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
            className={`flex h-11 min-w-11 items-center justify-center rounded-full px-2 ${i === index ? "bg-cm-red" : "bg-white/10"}`}
          >
            <span className={`block h-2 w-2 rounded-full ${i === index ? "bg-white" : "bg-white/40"}`} />
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
