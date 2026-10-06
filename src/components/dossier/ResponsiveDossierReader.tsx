"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DossierBlockViewport, DossierManifestPublic } from "@/lib/dossier/types";
import { DossierBlockLightbox } from "@/components/dossier/DossierBlockLightbox";

type LoadState = "loading" | "ready" | "blocked" | "error" | "processing";

const MOBILE_MAX = 767;

function blockSrc(slug: string, blockId: string, w: number, fmt: "webp" | "avif") {
  return `/api/dossier/${encodeURIComponent(slug)}/blocks/${encodeURIComponent(blockId)}?w=${w}&fmt=${fmt}`;
}

function buildSrcSet(slug: string, blockId: string, widths: number[], fmt: "webp" | "avif") {
  return widths.map((w) => `${blockSrc(slug, blockId, w, fmt)} ${w}w`).join(", ");
}

function useReaderViewport(): DossierBlockViewport | null {
  const [viewport, setViewport] = useState<DossierBlockViewport | null>(null);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_MAX}px)`);
    const sync = () => setViewport(mq.matches ? "mobile" : "desktop");
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return viewport;
}

export function ResponsiveDossierReader({ slug }: { slug: string }) {
  const [manifest, setManifest] = useState<DossierManifestPublic | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [errorDetail, setErrorDetail] = useState("");
  const [lightboxBlockId, setLightboxBlockId] = useState<string | null>(null);
  const [failedBlocks, setFailedBlocks] = useState<Set<string>>(new Set());
  const [indexOpen, setIndexOpen] = useState(false);
  const scrollRestore = useRef(0);
  const readerViewport = useReaderViewport();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/dossier/${encodeURIComponent(slug)}/manifest`, {
          credentials: "include",
        });
        if (res.status === 403) {
          if (!cancelled) setState("blocked");
          return;
        }
        if (res.status === 202) {
          if (!cancelled) setState("processing");
          return;
        }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          if (!cancelled) {
            setState("error");
            setErrorDetail(typeof body.error === "string" ? body.error : "Erro ao carregar dossiê.");
          }
          return;
        }
        const data = (await res.json()) as DossierManifestPublic;
        if (!cancelled) {
          setManifest(data);
          setState("ready");
        }
      } catch {
        if (!cancelled) {
          setState("error");
          setErrorDetail("Falha de rede ao carregar o dossiê.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const blocks = useMemo(() => {
    const sorted = (manifest?.blocks ?? []).slice().sort((a, b) => a.order - b.order);
    if (!readerViewport) return sorted;
    const forViewport = sorted.filter((b) => b.viewport === readerViewport);
    if (forViewport.length) return forViewport;
    return sorted;
  }, [manifest, readerViewport]);

  const openLightbox = useCallback((blockId: string) => {
    scrollRestore.current = window.scrollY;
    setLightboxBlockId(blockId);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxBlockId(null);
    requestAnimationFrame(() => {
      window.scrollTo({ top: scrollRestore.current, behavior: "auto" });
    });
  }, []);

  const markBlockFailed = useCallback((blockId: string) => {
    setFailedBlocks((prev) => new Set(prev).add(blockId));
  }, []);

  if (state === "loading" || readerViewport === null) {
    return (
      <div className="space-y-6" aria-busy="true">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="w-full animate-pulse rounded-[4px] bg-cm-bg-elevated"
            style={{ aspectRatio: "3/4" }}
          />
        ))}
      </div>
    );
  }

  if (state === "blocked") {
    return null;
  }

  if (state === "processing") {
    return (
      <p className="rounded-[4px] border border-cm-divider bg-cm-bg-elevated px-4 py-6 text-sm text-cm-gray">
        Dossiê em processamento editorial. Volte em breve.
      </p>
    );
  }

  if (state === "error" || !manifest) {
    return (
      <div className="rounded-[4px] border border-cm-divider bg-cm-bg-elevated px-4 py-6 text-sm text-cm-gray">
        <p>{errorDetail || "Não foi possível carregar o leitor."}</p>
        <button
          type="button"
          className="mt-3 min-h-11 text-cm-red underline"
          onClick={() => window.location.reload()}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const widths = blocks[0]?.widths ?? [640, 960, 1440];
  const isMobile = readerViewport === "mobile";
  const imageSizes = isMobile
    ? "calc(100vw - 2rem)"
    : "min(72rem, calc(100vw - 2.25rem))";

  return (
    <div className="space-y-6 md:space-y-8">
      {blocks.length > 1 ? (
        isMobile ? (
          <div className="sticky top-0 z-10 rounded-[4px] border border-cm-divider bg-cm-bg/95 backdrop-blur-sm">
            <button
              type="button"
              className="flex min-h-11 w-full items-center justify-between px-3 py-2 text-left text-sm text-white"
              aria-expanded={indexOpen}
              onClick={() => setIndexOpen((o) => !o)}
            >
              <span className="font-display tracking-wide">Índice</span>
              <span className="text-cm-gray" aria-hidden>
                {indexOpen ? "▲" : "▼"}
              </span>
            </button>
            {indexOpen ? (
              <label className="block border-t border-cm-divider px-3 pb-3 pt-2">
                <span className="sr-only">Ir para seção</span>
                <select
                  className="min-h-11 w-full rounded-[4px] border border-cm-divider bg-cm-bg-elevated px-2 text-sm text-white"
                  defaultValue=""
                  onChange={(e) => {
                    const id = e.target.value;
                    if (!id) return;
                    document.getElementById(`dossier-block-${id}`)?.scrollIntoView({ behavior: "smooth" });
                    setIndexOpen(false);
                  }}
                >
                  <option value="" disabled>
                    Escolha uma seção…
                  </option>
                  {blocks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.label ?? b.altText}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
        ) : (
          <nav
            aria-label="Índice do dossiê"
            className="sticky top-0 z-10 rounded-[4px] border border-cm-divider bg-cm-bg/95 px-3 py-2 backdrop-blur-sm"
          >
            <p className="mb-2 text-xs text-cm-gray">Seções — role horizontalmente se necessário</p>
            <ul className="-mx-1 flex gap-2 overflow-x-auto pb-1 text-xs text-cm-gray">
              {blocks.map((b) => (
                <li key={b.id} className="shrink-0">
                  <a
                    href={`#dossier-block-${b.id}`}
                    className="inline-flex min-h-11 items-center rounded-[4px] border border-cm-divider/60 px-3 hover:border-cm-divider hover:text-white"
                  >
                    {b.label ?? `Seção ${b.order}`}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )
      ) : null}

      {blocks.map((block, index) => (
        <section
          key={block.id}
          id={`dossier-block-${block.id}`}
          className="scroll-mt-24"
          aria-labelledby={block.label && !block.omitUiLabel ? `heading-${block.id}` : undefined}
        >
          {block.label && !block.omitUiLabel ? (
            <h2
              id={`heading-${block.id}`}
              className="mb-2 font-display text-sm tracking-[0.2em] text-cm-gray md:mb-3"
            >
              {block.label}
            </h2>
          ) : null}

          {failedBlocks.has(block.id) ? (
            <div className="rounded-[4px] border border-cm-divider px-4 py-6 text-sm text-cm-gray">
              <p>Não foi possível carregar esta seção.</p>
              <button
                type="button"
                className="mt-2 min-h-11 text-cm-red underline"
                onClick={() => {
                  setFailedBlocks((prev) => {
                    const next = new Set(prev);
                    next.delete(block.id);
                    return next;
                  });
                }}
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="block w-full max-w-none text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cm-red md:rounded-[4px] md:border md:border-cm-divider md:bg-black/30"
              onClick={() => openLightbox(block.id)}
              aria-label={`Ampliar: ${block.altText}`}
            >
              <picture>
                <source
                  type="image/avif"
                  srcSet={buildSrcSet(slug, block.id, widths, "avif")}
                  sizes={imageSizes}
                />
                <img
                  src={blockSrc(slug, block.id, isMobile ? 640 : 960, "webp")}
                  srcSet={buildSrcSet(slug, block.id, widths, "webp")}
                  sizes={imageSizes}
                  alt={block.altText}
                  loading={index === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className="mx-auto block h-auto w-full max-w-none object-contain md:max-w-[min(72rem,100%)]"
                  onError={() => markBlockFailed(block.id)}
                />
              </picture>
            </button>
          )}

          {block.credit ? (
            <p className="mt-2 text-xs text-cm-gray">{block.credit}</p>
          ) : null}
        </section>
      ))}

      {lightboxBlockId ? (
        <DossierBlockLightbox
          slug={slug}
          blockId={lightboxBlockId}
          block={blocks.find((b) => b.id === lightboxBlockId)!}
          widths={widths}
          onClose={closeLightbox}
        />
      ) : null}
    </div>
  );
}
