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
}: {
  slug: string;
  assetId: string;
  alt: string;
  caption?: string;
  credit?: string;
  portrait?: boolean;
}) {
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
      <figure className="mx-auto w-full max-w-[75rem]">
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
            className={`mx-auto h-auto w-full object-contain ${
              portrait ? "max-h-[75vh]" : "max-h-[min(75vh,720px)]"
            }`}
            loading="lazy"
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
          <div className="flex min-h-11 items-center justify-end gap-2 px-4 py-2">
            <button
              type="button"
              className="min-h-11 min-w-11 rounded-[4px] border border-cm-divider px-3 text-sm text-white"
              onClick={close}
            >
              Fechar
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center overflow-hidden px-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={assetSrc(slug, assetId, 1440)}
              alt={alt}
              className="max-h-full max-w-full object-contain"
              draggable={false}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
