"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DossierDocument } from "@/lib/dossier/document-types";
import {
  DossierDocumentEditor,
  type DocumentVersionSummary,
} from "@/components/dossier/DossierDocumentEditor";
import { Button } from "@/components/ui/Button";
import { dossierJobProgressLabel, dossierJobStatusLabel } from "@/lib/dossier/job-labels";
import { humanizeDossierProcessingError } from "@/lib/dossier/processing-errors";

type JobSummary = {
  id: string;
  status: string;
  progress?: string;
  error?: string;
  version: number;
};

export function DossierHtmlReviewPanel({ slug, title }: { slug: string; title?: string }) {
  const [document, setDocument] = useState<DossierDocument | null>(null);
  const [versions, setVersions] = useState<DocumentVersionSummary[]>([]);
  const [job, setJob] = useState<JobSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedPdfName, setSelectedPdfName] = useState<string | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [docRes, jobRes] = await Promise.all([
        fetch(`/api/admin/dossier/${slug}/document`),
        fetch(`/api/admin/dossier/${slug}/jobs`),
      ]);
      const docData = await docRes.json();
      const jobData = await jobRes.json();
      if (docRes.ok && docData.document) {
        setDocument(docData.document);
        setVersions(docData.versions ?? []);
      } else if (docRes.status !== 404) {
        throw new Error(docData.error ?? "Erro ao carregar documento.");
      } else {
        setDocument(null);
        setVersions([]);
      }
      setJob(jobData.job ?? null);
    } catch (e) {
      setDocument(null);
      setError(e instanceof Error ? e.message : "Falha ao carregar.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!job || !["uploaded", "processing"].includes(job.status)) return;
    const t = setInterval(() => {
      void fetch(`/api/admin/dossier/${slug}/jobs`)
        .then((r) => r.json())
        .then((data) => {
          setJob(data.job ?? null);
          if (data.job?.status === "needs_review" || data.job?.status === "failed") {
            void load();
          }
        });
    }, 4000);
    return () => clearInterval(t);
  }, [job, slug, load]);

  async function runAction(
    action: "save_draft" | "publish" | "unpublish" | "new_version" | "restore_version",
    extra?: { versionId?: string },
  ) {
    if (!document) return;
    if (action === "publish" && document.status === "needs_review" && document.meta.extractionWarnings.length) {
      if (
        !confirm(
          "Há avisos de extração/OCR. Confirma publicação após revisão editorial?",
        )
      ) {
        return;
      }
    }
    if (action === "publish" && !confirm("Publicar esta versão HTML para membros?")) return;
    if (action === "unpublish" && !confirm("Despublicar o documento HTML?")) return;
    if (action === "new_version" && !confirm("Criar nova versão de rascunho?")) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/dossier/${slug}/document`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document, action, versionId: extra?.versionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      if (data.document) setDocument(data.document);
      if (action === "unpublish") await load();
      else {
        const vRes = await fetch(`/api/admin/dossier/${slug}/document`);
        const vData = await vRes.json();
        if (vData.versions) setVersions(vData.versions);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha na operação.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadPdf(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("slug", slug);
      fd.set("file", file);
      const res = await fetch("/api/admin/dossier/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      setJob({ id: data.jobId, status: "uploaded", version: 0 });
      alert(data.message ?? "PDF enviado. Aguarde o processamento na fila.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no upload.");
    } finally {
      setUploading(false);
    }
  }

  async function triggerWorkerOnce() {
    setError(null);
    try {
      const res = await fetch("/api/admin/dossier/worker", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? data.message ?? "Falha ao processar a fila.");
      if (data.processed === false) {
        setError(data.message ?? "Nenhuma tarefa pendente na fila.");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Processamento indisponível neste ambiente.");
    }
  }

  if (loading) return <p className="text-sm text-cm-gray">Carregando documento HTML…</p>;

  const blockCount = document?.sections.reduce((n, s) => n + s.blocks.length, 0) ?? 0;

  return (
    <section className="space-y-6 rounded-[4px] border border-cm-divider p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-cm-red">Documento HTML</p>
        {title ? <h1 className="font-display mt-1 text-2xl text-white">{title}</h1> : null}
        <p className="mt-2 text-sm text-cm-gray">
          {document
            ? `Status: ${document.status} · v${document.version} · ${blockCount} blocos · ${document.meta.charCount} caracteres${document.meta.ocrUsed ? " · OCR" : ""}`
            : "Sem rascunho HTML — envie um PDF ou use o bootstrap editorial (Banfield)."}
        </p>
        {job ? (
          <p className="mt-1 text-xs text-cm-gray">
            Fila: {dossierJobStatusLabel(job.status)}
            {job.progress ? ` (${dossierJobProgressLabel(job.progress)})` : ""}
            {job.error ? ` — ${humanizeDossierProcessingError(job.error)}` : ""}
          </p>
        ) : null}
      </header>

      <div className="rounded border border-cm-divider p-4">
        <h2 className="text-sm font-semibold text-white">Enviar PDF → extração → revisão</h2>
        <p className="mt-1 text-xs text-cm-gray">
          Armazenamento privado + fila no banco. O processador extrai texto e imagens (OCR manual se necessário). Não
          publica automaticamente.
        </p>
        <div className="mt-3 space-y-2 text-sm">
          <span className="font-medium text-white">Arquivo PDF</span>
          <input
            ref={pdfInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              setSelectedPdfName(f?.name ?? null);
              if (f) uploadPdf(f);
            }}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              className="min-h-11"
              disabled={uploading}
              onClick={() => pdfInputRef.current?.click()}
            >
              {uploading ? "Enviando…" : "Escolher PDF"}
            </Button>
            {selectedPdfName ? (
              <span className="text-cm-gray">{selectedPdfName}</span>
            ) : (
              <span className="text-cm-gray">Nenhum arquivo selecionado</span>
            )}
          </div>
        </div>
        <Button type="button" variant="secondary" className="mt-3 min-h-11" onClick={() => triggerWorkerOnce()}>
          Processar próximo da fila
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-cm-red-light" role="alert">
          {error}
        </p>
      ) : null}

      {!document ? (
        <div className="rounded border border-dashed border-cm-divider p-4 text-sm text-cm-gray">
          Aguardando processamento do PDF ou carga editorial manual.
        </div>
      ) : (
        <DossierDocumentEditor
          slug={slug}
          document={document}
          versions={versions}
          onDocumentChange={setDocument}
          onSave={runAction}
          saving={saving}
        />
      )}
    </section>
  );
}
