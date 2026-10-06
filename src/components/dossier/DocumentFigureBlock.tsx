"use client";

import { useCallback, useEffect, useState } from "react";

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
  showWhen,
}: {
  slug: string;
  assetId: string;
  alt: string;
  caption?: string;
  credit?: string;
  portrait?: boolean;
  showWhen?: "mobile-only" | "desktop-only";
}) {
  const visibility =
    showWhen === "mobile-only"
      ? "lg:hidden"
      : showWhen === "desktop-only"
        ? "hidden lg:block"
        : "";
  const mapPanel = assetId.startsWith("fig-mapa");
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  return (
    <>
      <figure
        className={`mx-auto w-full max-w-[75rem] ${visibility}`}
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
            className={`mx-auto block w-full object-contain ${
              portrait ? "h-auto max-h-[75vh]" : "h-auto"
            }`}
            loading="eager"
            decoding="async"
          />
        </button>
        {caption ? <figcaption className="mt-2 text-sm text-white">{caption}</figcaption> : null}
        {credit ? <p className="text-xs text-cm-gray">Crédito: {credit}</p> : null}
      </figure>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/95 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]"
          role="dialog"
          aria-modal="true"
          aria-label={alt}
        >
          <div className="flex min-h-11 shrink-0 items-center justify-end gap-2 px-4 py-2">
            <button
              type="button"
              className="min-h-11 min-w-11 rounded-[4px] border border-cm-divider px-3 text-sm text-white"
              onClick={close}
            >
              Fechar
            </button>
          </div>
          <div
            className={`min-h-0 flex-1 ${
              mapPanel ? "overflow-auto overscroll-contain px-1 pb-4" : "overflow-hidden px-2"
            }`}
          >
            <div
              className={
                mapPanel
                  ? "mx-auto flex min-h-full w-full max-w-[min(100vw,960px)] items-start justify-center"
                  : "flex h-full min-h-[50vh] items-center justify-center"
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={assetSrc(slug, assetId, mapPanel ? 1920 : 1440)}
                alt={alt}
                className={
                  mapPanel
                    ? "block h-auto w-full max-w-none object-contain"
                    : "max-h-[85vh] max-w-full object-contain"
                }
                draggable={false}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
