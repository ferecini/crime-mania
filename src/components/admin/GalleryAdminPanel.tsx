"use client";

import { useCallback, useEffect, useState } from "react";
import type { GalleryItem, GalleryManifest } from "@/lib/gallery/types";
import { Button } from "@/components/ui/Button";

function previewSrc(slug: string, id: string) {
  return `/api/dossier/${encodeURIComponent(slug)}/gallery/${encodeURIComponent(id)}`;
}

export function GalleryAdminPanel({ slug, title }: { slug: string; title: string }) {
  const [manifest, setManifest] = useState<GalleryManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/gallery/${slug}/manifest`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      setManifest(data.manifest);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  function updateItem(id: string, patch: Partial<GalleryItem>) {
    if (!manifest) return;
    setManifest({
      ...manifest,
      items: manifest.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    });
  }

  function moveItem(id: string, dir: -1 | 1) {
    if (!manifest) return;
    const sorted = manifest.items.slice().sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((i) => i.id === id);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swap];
    sorted[idx] = { ...b, order: a.order };
    sorted[swap] = { ...a, order: b.order };
    const reordered = sorted
      .sort((x, y) => x.order - y.order)
      .map((it, i) => ({ ...it, order: i + 1 }));
    setManifest({ ...manifest, items: reordered });
  }

  async function patch(action: "save_draft" | "publish" | "unpublish") {
    if (!manifest) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/gallery/${slug}/manifest`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: manifest.items, coverImageId: manifest.coverImageId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      if (data.manifest) setManifest(data.manifest);
      if (action === "unpublish") await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    setSaving(true);
    const fd = new FormData();
    for (const f of fileList) fd.append("files", f);
    try {
      const res = await fetch(`/api/admin/gallery/${slug}/upload`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload falhou");
      setManifest(data.manifest);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload falhou.");
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(id: string) {
    if (!confirm("Remover esta imagem?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/gallery/${slug}/items/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      setManifest(data.manifest);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao remover.");
    } finally {
      setSaving(false);
    }
  }

  const sorted = manifest?.items.slice().sort((a, b) => a.order - b.order) ?? [];
  const maxW = viewport === "mobile" ? 390 : 720;

  if (loading) return <p className="text-sm text-cm-gray">Carregando galeria…</p>;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-xl text-white">{title}</h2>
        <p className="text-sm text-cm-gray">Galeria · {slug}</p>
      </header>

      <section className="rounded border border-cm-divider p-4">
        <h3 className="text-sm font-semibold text-white">Upload (JPG/PNG/WebP/AVIF)</h3>
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="mt-2 block min-h-11 w-full text-sm"
          disabled={saving}
          onChange={(e) => uploadFiles(e.target.files)}
        />
      </section>

      <div className="flex gap-2">
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

      <ol className="space-y-4" style={{ maxWidth: maxW }}>
        {sorted.map((item) => (
          <li key={item.id} className="rounded border border-cm-divider p-4">
            <div className="mb-2 flex flex-wrap gap-2">
              <button type="button" className="min-h-11 min-w-11 rounded border border-cm-divider" onClick={() => moveItem(item.id, -1)} aria-label="Subir">
                ↑
              </button>
              <button type="button" className="min-h-11 min-w-11 rounded border border-cm-divider" onClick={() => moveItem(item.id, 1)} aria-label="Descer">
                ↓
              </button>
              <button
                type="button"
                className={`min-h-11 rounded px-2 text-xs ${manifest?.coverImageId === item.id ? "bg-cm-red text-white" : "border border-cm-divider text-cm-gray"}`}
                onClick={() => manifest && setManifest({ ...manifest, coverImageId: item.id })}
              >
                Capa
              </button>
              <button type="button" className="min-h-11 rounded border border-cm-red/40 px-2 text-xs text-cm-red-light" onClick={() => removeItem(item.id)}>
                Remover
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewSrc(slug, item.id)} alt={item.alt} className="mb-3 max-h-48 w-full object-contain" />
            <label className="block text-xs text-cm-gray">
              Legenda
              <input className="cm-input mt-1 min-h-11 w-full" value={item.caption} onChange={(e) => updateItem(item.id, { caption: e.target.value })} />
            </label>
            <label className="mt-2 block text-xs text-cm-gray">
              Alt
              <input className="cm-input mt-1 min-h-11 w-full" value={item.alt} onChange={(e) => updateItem(item.id, { alt: e.target.value })} />
            </label>
            <label className="mt-2 block text-xs text-cm-gray">
              Crédito
              <input className="cm-input mt-1 min-h-11 w-full" value={item.credit ?? ""} onChange={(e) => updateItem(item.id, { credit: e.target.value })} />
            </label>
            <label className="mt-2 block text-xs text-cm-gray">
              sourceType
              <select
                className="cm-input mt-1 min-h-11 w-full"
                value={item.sourceType}
                onChange={(e) => updateItem(item.id, { sourceType: e.target.value as GalleryItem["sourceType"] })}
              >
                <option value="ai_placeholder">ai_placeholder</option>
                <option value="editorial">editorial</option>
                <option value="photo">photo</option>
                <option value="document">document</option>
              </select>
            </label>
            <label className="mt-2 flex min-h-11 items-center gap-2 text-sm text-cm-gray">
              <input type="checkbox" checked={item.isIllustrative} onChange={(e) => updateItem(item.id, { isIllustrative: e.target.checked })} />
              isIllustrative
            </label>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-3">
        <Button type="button" className="min-h-11" disabled={saving} onClick={() => patch("save_draft")}>
          Salvar rascunho
        </Button>
        <Button type="button" variant="secondary" className="min-h-11" disabled={saving} onClick={() => patch("publish")}>
          Publicar
        </Button>
        <Button type="button" variant="secondary" className="min-h-11" disabled={saving} onClick={() => patch("unpublish")}>
          Despublicar
        </Button>
      </div>
    </div>
  );
}
