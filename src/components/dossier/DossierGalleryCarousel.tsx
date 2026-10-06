"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { DossierGalleryImage } from "@/data/dossiers";

export function DossierGalleryCarousel({ images }: { images: DossierGalleryImage[] }) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const go = useCallback(
    (delta: number) => {
      if (!images.length) return;
      setIndex((i) => (i + delta + images.length) % images.length);
    },
    [images.length],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "Escape") setLightbox(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (!images.length) {
    return (
      <section className="rounded-[4px] border border-dashed border-cm-divider p-8 text-center">
        <h2 className="font-display text-lg text-white">Galeria</h2>
        <p className="mt-2 text-sm text-cm-gray">Galeria em preparação.</p>
      </section>
    );
  }

  const current = images[index];
  const prev = images[(index - 1 + images.length) % images.length];
  const next = images[(index + 1) % images.length];

  return (
    <section className="space-y-4" aria-label="Galeria do caso">
      <h2 className="font-display text-lg text-white">Galeria</h2>
      <div
        className="relative flex items-center justify-center gap-2 md:gap-4"
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
          className="inline-flex h-11 min-w-11 items-center justify-center rounded-full border border-cm-divider text-white hover:bg-white/5"
          aria-label="Imagem anterior"
        >
          ←
        </button>
        <div className="grid flex-1 grid-cols-[minmax(0,0.65fr)_minmax(0,1.35fr)_minmax(0,0.65fr)] items-center gap-2">
          <button type="button" onClick={() => go(-1)} className="relative hidden aspect-[4/5] overflow-hidden rounded opacity-60 md:block">
            <Image src={prev.src} alt="" fill className="object-cover" sizes="120px" />
          </button>
          <button
            type="button"
            onClick={() => setLightbox(true)}
            className="relative aspect-[4/5] w-full overflow-hidden rounded-[4px] border border-cm-divider"
          >
            <Image
              src={current.src}
              alt={current.alt}
              fill
              className="object-cover"
              sizes="(max-width:768px) 100vw, 640px"
              draggable={false}
            />
          </button>
          <button type="button" onClick={() => go(1)} className="relative hidden aspect-[4/5] overflow-hidden rounded opacity-60 md:block">
            <Image src={next.src} alt="" fill className="object-cover" sizes="120px" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          className="inline-flex h-11 min-w-11 items-center justify-center rounded-full border border-cm-divider text-white hover:bg-white/5"
          aria-label="Próxima imagem"
        >
          →
        </button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="text-white">{current.caption}</p>
        {current.credit && <p className="text-cm-gray">Crédito: {current.credit}</p>}
      </div>
      <div className="flex justify-center gap-2" role="tablist" aria-label="Indicadores da galeria">
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Imagem ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-2.5 w-2.5 rounded-full ${i === index ? "bg-cm-red" : "bg-white/20"}`}
          />
        ))}
      </div>
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Visualização ampliada"
        >
          <button
            type="button"
            className="absolute right-4 top-4 min-h-11 min-w-11 rounded border border-white/20 text-white"
            onClick={() => setLightbox(false)}
          >
            Fechar
          </button>
          <div className="relative max-h-[90vh] w-full max-w-3xl">
            <Image
              src={current.src}
              alt={current.alt}
              width={1200}
              height={1500}
              className="mx-auto h-auto max-h-[85vh] w-auto object-contain"
            />
          </div>
        </div>
      )}
    </section>
  );
}
