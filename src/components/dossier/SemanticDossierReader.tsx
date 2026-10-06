"use client";

import { useEffect, useState } from "react";
import type { DossierDocumentPublic } from "@/lib/dossier/document-types";
import { DocumentBlockView } from "@/components/dossier/DocumentBlockView";

type LoadState = "loading" | "ready" | "blocked" | "error" | "processing";

export function SemanticDossierReader({ slug }: { slug: string }) {
  const [doc, setDoc] = useState<DossierDocumentPublic | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [errorDetail, setErrorDetail] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/dossier/${encodeURIComponent(slug)}/document`, {
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
        const data = (await res.json()) as DossierDocumentPublic;
        if (!cancelled) {
          setDoc(data);
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

  if (state === "loading") {
    return (
      <div className="rounded-[4px] border border-cm-divider px-4 py-8 text-center text-sm text-cm-gray">
        Carregando dossiê…
      </div>
    );
  }

  if (state === "blocked") {
    return (
      <p className="text-sm text-cm-gray">Conteúdo reservado a assinantes.</p>
    );
  }

  if (state === "processing") {
    return (
      <div className="space-y-2 rounded-[4px] border border-dashed border-cm-divider p-6">
        <p className="font-display text-white">Documento em processamento</p>
        <p className="text-sm text-cm-gray">
          A extração editorial está em andamento. Enquanto isso, use o download do PDF original.
        </p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="space-y-2 rounded-[4px] border border-cm-red/40 bg-cm-red/5 p-6" role="alert">
        <p className="font-display text-white">Não foi possível carregar o leitor</p>
        <p className="text-sm text-cm-gray">{errorDetail}</p>
        <button
          type="button"
          className="text-sm text-cm-red-light underline"
          onClick={() => window.location.reload()}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!doc) return null;

  return (
    <div className="dossier-html-reader mx-auto max-w-3xl space-y-10 px-4 md:max-w-[42rem] md:px-0 lg:max-w-[46rem]">
      {doc.meta.extractionWarnings.length > 0 ? (
        <ul className="rounded border border-amber-500/30 bg-amber-950/20 p-3 text-sm text-amber-100/90">
          {doc.meta.extractionWarnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}
      {doc.sections
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((section) => (
          <section key={section.id} className="space-y-5" aria-labelledby={`sec-${section.id}`}>
            {section.title ? (
              <h2 id={`sec-${section.id}`} className="sr-only">
                {section.title}
              </h2>
            ) : null}
            {section.blocks
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((block) => (
                <DocumentBlockView key={block.id} slug={slug} block={block} />
              ))}
          </section>
        ))}
    </div>
  );
}
