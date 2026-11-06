"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DossierDocument } from "@/lib/dossier/document-types";
import { DossierCaseFormEditor } from "@/components/dossier/DossierCaseFormEditor";
import { DossierDocumentEditor } from "@/components/dossier/DossierDocumentEditor";
import type { DocumentSaveAction, DocumentVersionSummary } from "@/components/dossier/DossierDocumentActions";
import { emptyCaseForm, importCaseForm } from "@/lib/dossier/case-form";
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
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
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

  async function createBlank() {
    setSaving(true);
    setError(null);
    try {
      const blank: DossierDocument = {
        slug,
        title: title ?? slug,
        version: 1,
        status: "needs_review",
        sections: [],
        caseForm: emptyCaseForm(title ?? ""),
        meta: { charCount: 0, ocrUsed: false, extractionWarnings: [] },
      };
      const res = await fetch(`/api/admin/dossier/${slug}/document`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document: blank, action: "save_draft" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      setDocument(data.document);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao criar dossiê.");
    } finally {
      setSaving(false);
    }
  }

  async function runAction(action: DocumentSaveAction, extra?: { versionId?: string }) {
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
    setUploadMessage(null);
    try {
      const fd = new FormData();
      fd.set("slug", slug);
      fd.set("file", file);
      const res = await fetch("/api/admin/dossier/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      setJob({ id: data.jobId, status: "uploaded", version: 0 });
      setUploadMessage(
        "PDF enviado. O processamento começa em seguida — acompanhe o status na fila abaixo.",
      );
      await load();
      void fetch("/api/admin/dossier/worker", { method: "POST" })
        .then(() => load())
        .catch(() => {
          /* fila GitHub Actions (~10 min) se o processador imediato falhar */
        });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no upload.");
    } finally {
      setUploading(false);
    }
  }

  if (loading) return <p className="text-sm text-cm-gray">Carregando documento HTML…</p>;

  const blockCount = document?.sections.reduce((n, s) => n + s.blocks.length, 0) ?? 0;

  return (
    <section className="space-y-6 rounded-[4px] border border-cm-divider p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-cm-red">Dossiê — conteúdo estruturado</p>
        {title ? <h1 className="font-display mt-1 text-2xl text-white">{title}</h1> : null}
        <p className="mt-2 text-sm text-cm-gray">
          {document
            ? `Status: ${document.status} · v${document.version} · ${blockCount} blocos · ${document.meta.charCount} caracteres${document.meta.ocrUsed ? " · OCR" : ""}`
            : "Sem rascunho — crie um dossiê em branco (sem PDF) ou importe de um PDF."}
        </p>
        {job ? (
          <p className="mt-1 text-xs text-cm-gray">
            Fila: {dossierJobStatusLabel(job.status)}
            {job.progress ? ` (${dossierJobProgressLabel(job.progress)})` : ""}
            {job.error ? ` — ${humanizeDossierProcessingError(job.error)}` : ""}
          </p>
        ) : null}
      </header>

      <details className="rounded border border-cm-divider p-4">
        <summary className="min-h-11 cursor-pointer text-sm font-semibold text-white">
          Importar de PDF (opcional — fluxo legado)
        </summary>
        <p className="mt-1 text-xs text-cm-gray">
          Armazenamento privado + fila no banco. Após o envio, o processamento é automático (texto e imagens; OCR manual
          se necessário). Não publica automaticamente.
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
      </details>

      {uploadMessage ? (
        <p className="text-sm text-emerald-400" role="status">
          {uploadMessage}
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-cm-red-light" role="alert">
          {error}
        </p>
      ) : null}

      {!document ? (
        <div className="space-y-3 rounded border border-dashed border-cm-divider p-4 text-sm text-cm-gray">
          <p>Nenhum conteúdo ainda. Comece pelo formulário — fotos, fases e linha do tempo, sem PDF.</p>
          <Button type="button" className="min-h-11" disabled={saving} onClick={createBlank}>
            {saving ? "Criando…" : "Criar dossiê em branco"}
          </Button>
        </div>
      ) : document.caseForm ? (
        <div className="space-y-4">
          <DossierCaseFormEditor
            slug={slug}
            document={document}
            form={document.caseForm}
            versions={versions}
            onDocumentChange={setDocument}
            onSave={runAction}
            saving={saving}
          />
          <button
            type="button"
            className="min-h-11 text-xs text-cm-gray underline"
            onClick={() => {
              if (
                confirm(
                  "Desativar o formulário e editar por blocos? O conteúdo atual é mantido, mas as seções deixam de ser regeneradas a partir dos campos.",
                )
              ) {
                setDocument({ ...document, caseForm: undefined });
              }
            }}
          >
            Desativar formulário (editor de blocos avançado)
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2 rounded border border-amber-500/30 bg-amber-950/20 p-4 text-sm text-amber-100/90">
            <p>
              Este dossiê usa o editor de blocos (legado: HTML editorial ou extraído de PDF). Converta para o formulário
              estruturado para editar fotos, fases e linha do tempo por campos.
            </p>
            <Button
              type="button"
              variant="secondary"
              className="min-h-11"
              onClick={() => setDocument({ ...document, caseForm: importCaseForm(document) })}
            >
              Converter para formulário
            </Button>
            <p className="text-xs">Revise os campos e salve o rascunho; nada é publicado até clicar em Publicar.</p>
          </div>
          <DossierDocumentEditor
            slug={slug}
            document={document}
            versions={versions}
            onDocumentChange={setDocument}
            onSave={runAction}
            saving={saving}
          />
        </div>
      )}
    </section>
  );
}
