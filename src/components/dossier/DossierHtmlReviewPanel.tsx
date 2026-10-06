"use client";

import { useCallback, useEffect, useState } from "react";
import type { DossierDocument } from "@/lib/dossier/document-types";
import { Button } from "@/components/ui/Button";

export function DossierHtmlReviewPanel({ slug }: { slug: string }) {
  const [document, setDocument] = useState<DossierDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/dossier/${slug}/document`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      setDocument(data.document);
    } catch (e) {
      setDocument(null);
      setError(e instanceof Error ? e.message : "Falha ao carregar documento HTML.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  async function runAction(action: "save_draft" | "publish" | "unpublish") {
    if (!document) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/dossier/${slug}/document`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      if (data.document) setDocument(data.document);
      if (action === "unpublish") await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha na operação.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-cm-gray">Carregando documento HTML…</p>;
  if (!document) {
    return (
      <div className="rounded border border-dashed border-cm-divider p-4 text-sm text-cm-gray">
        {error ?? "Nenhum documento HTML. Processe um PDF ou rode o bootstrap editorial."}
      </div>
    );
  }

  const blockCount = document.sections.reduce((n, s) => n + s.blocks.length, 0);

  return (
    <section className="space-y-4 rounded-[4px] border border-cm-divider p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg text-white">Documento HTML (v{document.version})</h2>
          <p className="text-sm text-cm-gray">
            Status: {document.status} · {blockCount} blocos · {document.meta.charCount} caracteres
            {document.meta.ocrUsed ? " · OCR" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" disabled={saving} onClick={() => runAction("save_draft")}>
            Salvar rascunho
          </Button>
          <Button type="button" disabled={saving} onClick={() => runAction("publish")}>
            Publicar HTML
          </Button>
          <Button type="button" variant="secondary" disabled={saving} onClick={() => runAction("unpublish")}>
            Despublicar
          </Button>
        </div>
      </div>
      {document.meta.extractionWarnings.length > 0 ? (
        <ul className="text-sm text-amber-200/90">
          {document.meta.extractionWarnings.map((w) => (
            <li key={w}>⚠ {w}</li>
          ))}
        </ul>
      ) : null}
      {error ? (
        <p className="text-sm text-cm-red-light" role="alert">
          {error}
        </p>
      ) : null}
      <p className="text-xs text-cm-gray">
        Edição granular de blocos (tipo, ordem, split/merge) virá na próxima iteração. Por ora, ajuste o JSON
        editorial e republica.
      </p>
    </section>
  );
}
