"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

function assetSrc(slug: string, assetId: string, width = 1440) {
  return `/api/dossier/${encodeURIComponent(slug)}/document/asset/${encodeURIComponent(assetId)}?w=${width}`;
}

export function DocumentFigureBlock({
  slug,
  assetId,
  alt,
  caption,
  credit,
  portrait,
  mapPanelLayout,
}: {
  slug: string;
  assetId: string;
  alt: string;
  caption?: string;
  credit?: string;
  portrait?: boolean;
  mapPanelLayout?: boolean;
}) {
  const mapPanel = assetId.startsWith("fig-mapa");
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [open, close]);

  /** Full-bleed só em viewports estreitos; md+ fica contido no grid/coluna */
  const bleed =
    mapPanelLayout && mapPanel
      ? "max-md:relative max-md:left-1/2 max-md:w-screen max-md:max-w-[100vw] max-md:-translate-x-1/2"
      : "";

  const lightbox =
    open && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] flex flex-col bg-black"
            role="dialog"
            aria-modal="true"
            aria-label={alt}
            style={{ isolation: "isolate" }}
          >
            <div className="flex shrink-0 items-center justify-end gap-2 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
              <button
                type="button"
                className="min-h-11 min-w-11 rounded-[4px] border border-cm-divider px-3 text-sm text-white"
                onClick={close}
              >
                Fechar
              </button>
            </div>
            <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto px-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={assetSrc(slug, assetId, mapPanel ? 1920 : 1440)}
                alt={alt}
                className="block h-auto w-full max-w-[min(100%,960px)] object-contain"
                draggable={false}
              />
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <figure
        className={`min-w-0 w-full ${mapPanelLayout ? "max-w-none" : "mx-auto max-w-[75rem]"} ${bleed}`}
        data-dossier-figure={assetId}
      >
        <button
          type="button"
          className="block w-full cursor-zoom-in border-0 bg-transparent p-0 text-left"
          onClick={() => setOpen(true)}
          aria-label={`Ampliar: ${alt}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assetSrc(slug, assetId, 960)}
            alt={alt}
            className={`block w-full ${portrait ? "h-auto max-h-[75vh]" : "h-auto"}`}
            loading="eager"
            decoding="async"
          />
        </button>
        {caption ? <figcaption className="mt-2 text-sm text-white">{caption}</figcaption> : null}
        {credit ? <p className="text-xs text-cm-gray">Crédito: {credit}</p> : null}
      </figure>
      {lightbox}
    </>
  );
}
