"use client";

import { useCallback, useEffect, useState } from "react";
import type { ProcessedDossierManifest } from "@/lib/dossier/types";
import { Button } from "@/components/ui/Button";

function reorderBlocks(blocks: ProcessedDossierManifest["blocks"]): ProcessedDossierManifest["blocks"] {
  return blocks
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((b, i) => ({ ...b, order: i + 1 }));
}

export function DossierReviewPanel({ slug, title }: { slug: string; title: string }) {
  const [manifest, setManifest] = useState<ProcessedDossierManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recropping, setRecropping] = useState<string | null>(null);
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/dossier/${slug}/manifest`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      setManifest(data.manifest);
    } catch (e) {
      setManifest(null);
      setError(e instanceof Error ? e.message : "Falha ao carregar.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  async function patchManifest(
    body: Record<string, unknown>,
    onOk?: (m: ProcessedDossierManifest) => void,
  ) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/dossier/${slug}/manifest`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      setManifest(data.manifest);
      onOk?.(data.manifest);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha na operação.");
    } finally {
      setSaving(false);
    }
  }

  function saveDraft() {
    if (!manifest) return;
    void patchManifest({
      blocks: manifest.blocks,
      plainText: manifest.plainText,
      action: "save_draft",
    });
  }

  function approve() {
    if (!manifest) return;
    void patchManifest({
      blocks: manifest.blocks,
      plainText: manifest.plainText,
      action: "approve",
    });
  }

  function publish() {
    if (!manifest || !confirm("Publicar esta versão para membros? A versão publicada anterior permanece até esta ação.")) {
      return;
    }
    void patchManifest({
      blocks: manifest.blocks,
      plainText: manifest.plainText,
      action: "publish",
    });
  }

  function unpublish() {
    if (!manifest || !confirm("Despublicar o PDF processado? Membros deixam de ver o leitor nativo.")) return;
    void patchManifest({ action: "unpublish", blocks: manifest.blocks, plainText: manifest.plainText });
  }

  function newVersion() {
    if (!manifest || !confirm("Criar rascunho de nova versão a partir da publicada?")) return;
    void patchManifest({ action: "new_version", blocks: manifest.blocks, plainText: manifest.plainText });
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
      alert(data.message ?? "Upload OK — aguarde o worker.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no upload.");
    } finally {
      setUploading(false);
    }
  }

  function updateBlock(id: string, patch: Partial<ProcessedDossierManifest["blocks"][0]>) {
    if (!manifest) return;
    setManifest({
      ...manifest,
      blocks: manifest.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    });
  }

  function moveBlock(id: string, dir: -1 | 1) {
    if (!manifest) return;
    const sorted = manifest.blocks.slice().sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const swap = idx + dir;
    if (swap < 0 || swap >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swap];
    sorted[idx] = { ...b, order: a.order };
    sorted[swap] = { ...a, order: b.order };
    setManifest({ ...manifest, blocks: reorderBlocks(sorted) });
  }

  function mergeWithNext(id: string) {
    if (!manifest?.sourceHeight) return;
    const sorted = manifest.blocks.slice().sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((b) => b.id === id);
    if (idx < 0 || idx >= sorted.length - 1) return;
    const a = sorted[idx];
    const b = sorted[idx + 1];
    const newY = Math.min(a.sourceY, b.sourceY);
    const newH = Math.max(a.sourceY + a.sourceHeight, b.sourceY + b.sourceHeight) - newY;
    const merged = {
      ...a,
      label: [a.label, b.label].filter(Boolean).join(" · "),
      sourceY: newY,
      sourceHeight: newH,
    };
    const rest = sorted.filter((bl) => bl.id !== b.id).map((bl) => (bl.id === a.id ? merged : bl));
    setManifest({ ...manifest, blocks: reorderBlocks(rest) });
  }

  function splitBlock(id: string) {
    if (!manifest) return;
    const block = manifest.blocks.find((b) => b.id === id);
    if (!block || block.sourceHeight < 40) return;
    const half = Math.floor(block.sourceHeight / 2);
    const secondId = `${block.id}-split-${Date.now()}`;
    const first = { ...block, sourceHeight: half };
    const second = {
      ...block,
      id: secondId,
      order: block.order + 0.5,
      sourceY: block.sourceY + half,
      sourceHeight: block.sourceHeight - half,
      label: `${block.label ?? block.id} (parte 2)`,
    };
    const blocks = manifest.blocks
      .filter((b) => b.id !== id)
      .concat([first, second]);
    setManifest({ ...manifest, blocks: reorderBlocks(blocks) });
  }

  async function applyRecrop(blockId: string) {
    if (!manifest) return;
    const block = manifest.blocks.find((b) => b.id === blockId);
    if (!block) return;
    setRecropping(blockId);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/dossier/${slug}/blocks/${encodeURIComponent(blockId)}/recrop`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceX: block.sourceX ?? 0,
            sourceY: block.sourceY,
            sourceWidth: block.sourceWidth ?? manifest.sourceWidth ?? 1,
            sourceHeight: block.sourceHeight,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao recortar");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao aplicar corte.");
    } finally {
      setRecropping(null);
    }
  }

  const previewWidth = viewport === "mobile" ? 390 : 960;
  const canRecrop = Boolean(manifest?.sourcePageStorageKey);

  if (loading) return <p className="text-sm text-cm-gray">Carregando revisão…</p>;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-widest text-cm-red">Revisão — dossiê</p>
        <h1 className="font-display mt-2 text-2xl text-white">{title}</h1>
        <p className="mt-2 text-sm text-cm-gray">
          Rascunho: {manifest?.status ?? "sem manifesto"} · v{manifest?.version ?? "—"}
          {manifest?.publishedAt ? ` · publicado em ${manifest.publishedAt}` : ""}
        </p>
      </header>

      <section className="rounded border border-cm-divider p-4">
        <h2 className="text-sm font-semibold text-white">Upload PDF</h2>
        <p className="mt-1 text-xs text-cm-gray">
          Vercel Blob privado + fila Postgres. Worker (GitHub Actions ou API) processa fora do upload.
        </p>
        <input
          type="file"
          accept="application/pdf"
          className="mt-3 block min-h-11 w-full text-sm"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadPdf(f);
          }}
        />
      </section>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`min-h-11 rounded px-3 text-sm ${viewport === "desktop" ? "bg-cm-red text-white" : "bg-cm-bg-low text-cm-gray"}`}
          onClick={() => setViewport("desktop")}
        >
          Desktop
        </button>
        <button
          type="button"
          className={`min-h-11 rounded px-3 text-sm ${viewport === "mobile" ? "bg-cm-red text-white" : "bg-cm-bg-low text-cm-gray"}`}
          onClick={() => setViewport("mobile")}
        >
          390 px
        </button>
      </div>

      {error && (
        <p className="text-sm text-cm-red-light" role="alert">
          {error}
        </p>
      )}

      {!manifest ? (
        <p className="text-sm text-cm-gray">Aguardando processamento do worker ou upload.</p>
      ) : (
        <>
          <ol className="space-y-6" style={{ maxWidth: viewport === "mobile" ? 390 : undefined }}>
            {manifest.blocks
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((block) => (
                <li key={block.id} className="rounded border border-cm-divider p-4">
                  <div className="mb-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="min-h-11 rounded border border-cm-divider px-2 text-xs text-cm-gray"
                      onClick={() => moveBlock(block.id, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="min-h-11 rounded border border-cm-divider px-2 text-xs text-cm-gray"
                      onClick={() => moveBlock(block.id, 1)}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="min-h-11 rounded border border-cm-divider px-2 text-xs text-cm-gray"
                      onClick={() => mergeWithNext(block.id)}
                    >
                      Unir com próximo
                    </button>
                    <button
                      type="button"
                      className="min-h-11 rounded border border-cm-divider px-2 text-xs text-cm-gray"
                      onClick={() => splitBlock(block.id)}
                    >
                      Separar bloco
                    </button>
                  </div>
                  <label className="block text-xs text-cm-gray">
                    Título / rótulo
                    <input
                      className="cm-input mt-1 min-h-11 w-full"
                      value={block.label ?? ""}
                      onChange={(e) => updateBlock(block.id, { label: e.target.value })}
                    />
                  </label>
                  <label className="mt-2 block text-xs text-cm-gray">
                    Texto alternativo
                    <input
                      className="cm-input mt-1 min-h-11 w-full"
                      value={block.altText}
                      onChange={(e) => updateBlock(block.id, { altText: e.target.value })}
                    />
                  </label>
                  <label className="mt-2 block text-xs text-cm-gray">
                    Crédito
                    <input
                      className="cm-input mt-1 min-h-11 w-full"
                      value={block.credit ?? ""}
                      onChange={(e) => updateBlock(block.id, { credit: e.target.value })}
                    />
                  </label>
                  {canRecrop && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <label className="text-xs text-cm-gray">
                        Corte Y (px)
                        <input
                          type="number"
                          className="cm-input mt-1 min-h-11 w-full"
                          value={block.sourceY}
                          onChange={(e) =>
                            updateBlock(block.id, { sourceY: Number(e.target.value) || 0 })
                          }
                        />
                      </label>
                      <label className="text-xs text-cm-gray">
                        Altura (px)
                        <input
                          type="number"
                          className="cm-input mt-1 min-h-11 w-full"
                          value={block.sourceHeight}
                          onChange={(e) =>
                            updateBlock(block.id, { sourceHeight: Number(e.target.value) || 1 })
                          }
                        />
                      </label>
                      <Button
                        type="button"
                        variant="secondary"
                        className="min-h-11 sm:col-span-2"
                        disabled={recropping === block.id}
                        onClick={() => applyRecrop(block.id)}
                      >
                        {recropping === block.id ? "Gerando variantes…" : "Aplicar corte (re-render)"}
                      </Button>
                    </div>
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/dossier/${slug}/blocks/${block.id}?w=${previewWidth}&fmt=webp&t=${manifest.version}`}
                    alt={block.altText}
                    className="mt-3 w-full object-contain"
                    style={{ maxHeight: viewport === "mobile" ? 320 : 480 }}
                  />
                </li>
              ))}
          </ol>
          <label className="block text-sm text-cm-gray">
            Texto extraído (revisão)
            <textarea
              className="cm-input mt-2 min-h-[120px] w-full"
              value={manifest.plainText ?? ""}
              onChange={(e) => setManifest({ ...manifest, plainText: e.target.value })}
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <Button type="button" className="min-h-11" disabled={saving} onClick={saveDraft}>
              {saving ? "Salvando…" : "Salvar rascunho"}
            </Button>
            <Button type="button" variant="secondary" className="min-h-11" disabled={saving} onClick={approve}>
              Marcar revisado
            </Button>
            <Button type="button" variant="secondary" className="min-h-11" disabled={saving} onClick={publish}>
              Publicar
            </Button>
            <Button type="button" variant="secondary" className="min-h-11" disabled={saving} onClick={unpublish}>
              Despublicar
            </Button>
            <Button type="button" variant="secondary" className="min-h-11" disabled={saving} onClick={newVersion}>
              Nova versão (rascunho)
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
