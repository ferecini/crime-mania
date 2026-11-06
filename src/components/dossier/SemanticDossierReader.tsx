"use client";

import { useEffect, useState } from "react";
import type { DossierDocumentPublic } from "@/lib/dossier/document-types";
import { DossierDocumentView } from "@/components/dossier/DossierDocumentView";

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
          A extração editorial está em andamento. Volte em breve.
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
          className="min-h-11 text-sm text-cm-red-light underline"
          onClick={() => window.location.reload()}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!doc) return null;

  return (
    <DossierDocumentView
      slug={slug}
      sections={doc.sections}
      warnings={doc.meta.extractionWarnings}
    />
  );
}
