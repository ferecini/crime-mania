"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DossierManifestPublic } from "@/lib/dossier/types";
import { DossierBlockLightbox } from "@/components/dossier/DossierBlockLightbox";

type LoadState = "loading" | "ready" | "blocked" | "error" | "processing";

function blockSrc(slug: string, blockId: string, w: number, fmt: "webp" | "avif") {
  return `/api/dossier/${encodeURIComponent(slug)}/blocks/${encodeURIComponent(blockId)}?w=${w}&fmt=${fmt}`;
}

function buildSrcSet(slug: string, blockId: string, widths: number[], fmt: "webp" | "avif") {
  return widths.map((w) => `${blockSrc(slug, blockId, w, fmt)} ${w}w`).join(", ");
}

export function ResponsiveDossierReader({ slug }: { slug: string }) {
  const [manifest, setManifest] = useState<DossierManifestPublic | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [errorDetail, setErrorDetail] = useState("");
  const [lightboxBlockId, setLightboxBlockId] = useState<string | null>(null);
  const [failedBlocks, setFailedBlocks] = useState<Set<string>>(new Set());
  const scrollRestore = useRef(0);

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

  const blocks = useMemo(
    () => (manifest?.blocks ?? []).slice().sort((a, b) => a.order - b.order),
    [manifest],
  );

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

  if (state === "loading") {
    return (
      <div className="space-y-6" aria-busy="true">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="w-full animate-pulse rounded-[4px] bg-cm-bg-elevated"
            style={{ aspectRatio: "4/5" }}
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

  return (
    <div className="space-y-8">
      {blocks.length > 1 ? (
        <nav
          aria-label="Índice do dossiê"
          className="sticky top-0 z-10 -mx-1 overflow-x-auto rounded-[4px] border border-cm-divider bg-cm-bg/95 px-2 py-2 backdrop-blur-sm"
        >
          <ul className="flex gap-2 text-xs text-cm-gray">
            {blocks.map((b) => (
              <li key={b.id}>
                <a
                  href={`#dossier-block-${b.id}`}
                  className="inline-flex min-h-11 items-center whitespace-nowrap rounded-[4px] px-2 hover:text-white"
                >
                  {b.label ?? `Seção ${b.order}`}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {blocks.map((block, index) => (
        <section
          key={block.id}
          id={`dossier-block-${block.id}`}
          className="scroll-mt-24"
          aria-labelledby={block.label ? `heading-${block.id}` : undefined}
        >
          {block.label ? (
            <h2
              id={`heading-${block.id}`}
              className="mb-3 font-display text-sm tracking-[0.2em] text-cm-gray"
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
              className="block w-full overflow-hidden rounded-[4px] border border-cm-divider bg-black/30 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cm-red"
              onClick={() => openLightbox(block.id)}
              aria-label={`Ampliar: ${block.altText}`}
            >
              <picture>
                <source
                  type="image/avif"
                  srcSet={buildSrcSet(slug, block.id, widths, "avif")}
                  sizes="(max-width: 768px) 100vw, min(56rem, 100vw - 2.25rem)"
                />
                <img
                  src={blockSrc(slug, block.id, 960, "webp")}
                  srcSet={buildSrcSet(slug, block.id, widths, "webp")}
                  sizes="(max-width: 768px) 100vw, min(56rem, 100vw - 2.25rem)"
                  alt={block.altText}
                  width={960}
                  height={Math.round(960 / block.aspectRatio)}
                  loading={index === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className="mx-auto block h-auto w-full max-w-5xl"
                  style={{ aspectRatio: String(block.aspectRatio) }}
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
