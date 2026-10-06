"use client";

import { useMemo, useState } from "react";
import type {
  DocumentBlock,
  DocumentBlockType,
  DossierDocument,
  DossierDocumentSection,
} from "@/lib/dossier/document-types";
import { DocumentBlockView } from "@/components/dossier/DocumentBlockView";
import { Button } from "@/components/ui/Button";

const BLOCK_TYPES: DocumentBlockType[] = [
  "heading",
  "paragraph",
  "image",
  "figure",
  "quote",
  "list",
  "callout",
  "facts",
  "timeline",
  "table",
];

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function reorderSections(sections: DossierDocumentSection[]): DossierDocumentSection[] {
  return sections.map((s, i) => ({
    ...s,
    order: i + 1,
    blocks: s.blocks
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((b, bi) => ({ ...b, order: bi + 1 })),
  }));
}

function emptyBlock(type: DocumentBlockType): DocumentBlock {
  const id = newId("blk");
  switch (type) {
    case "heading":
      return { id, type, order: 0, level: 2, text: "Novo título" };
    case "paragraph":
      return { id, type, order: 0, text: "" };
    case "quote":
      return { id, type, order: 0, text: "" };
    case "callout":
      return { id, type, order: 0, variant: "info", text: "" };
    case "list":
      return { id, type, order: 0, style: "unordered", items: [""] };
    case "image":
      return { id, type, order: 0, assetId: "", alt: "", caption: "", credit: "" };
    case "figure":
      return { id, type, order: 0, assetId: "", alt: "", caption: "", credit: "" };
    case "facts":
      return { id, type, order: 0, items: [{ label: "", value: "" }] };
    case "timeline":
      return { id, type, order: 0, entries: [{ date: "", title: "", body: "" }] };
    case "table":
      return { id, type, order: 0, headers: ["Coluna"], rows: [[""]] };
    default:
      return { id, type: "paragraph", order: 0, text: "" };
  }
}

export type DocumentVersionSummary = { id: string; version: number; publishedAt: string };

type Props = {
  slug: string;
  document: DossierDocument;
  versions: DocumentVersionSummary[];
  onDocumentChange: (doc: DossierDocument) => void;
  onSave: (action: "save_draft" | "publish" | "unpublish" | "new_version" | "restore_version", extra?: { versionId?: string }) => Promise<void>;
  saving: boolean;
};

export function DossierDocumentEditor({
  slug,
  document,
  versions,
  onDocumentChange,
  onSave,
  saving,
}: Props) {
  const [expandedSection, setExpandedSection] = useState<string | null>(
    document.sections[0]?.id ?? null,
  );
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");

  const sections = useMemo(
    () => document.sections.slice().sort((a, b) => a.order - b.order),
    [document.sections],
  );

  function updateSections(mutator: (secs: DossierDocumentSection[]) => DossierDocumentSection[]) {
    onDocumentChange({ ...document, sections: reorderSections(mutator(document.sections)) });
  }

  function updateBlock(sectionId: string, blockId: string, patch: Partial<DocumentBlock>) {
    updateSections((secs) =>
      secs.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              blocks: s.blocks.map((b) => (b.id === blockId ? ({ ...b, ...patch } as DocumentBlock) : b)),
            }
          : s,
      ),
    );
  }

  function moveBlock(sectionId: string, blockId: string, dir: -1 | 1) {
    updateSections((secs) =>
      secs.map((s) => {
        if (s.id !== sectionId) return s;
        const sorted = s.blocks.slice().sort((a, b) => a.order - b.order);
        const idx = sorted.findIndex((b) => b.id === blockId);
        if (idx < 0) return s;
        const swap = idx + dir;
        if (swap < 0 || swap >= sorted.length) return s;
        const copy = sorted.slice();
        [copy[idx], copy[swap]] = [copy[swap]!, copy[idx]!];
        return { ...s, blocks: copy.map((b, i) => ({ ...b, order: i + 1 })) };
      }),
    );
  }

  function moveBlockToSection(fromSectionId: string, blockId: string, toSectionId: string) {
    if (fromSectionId === toSectionId) return;
    let moved: DocumentBlock | null = null;
    updateSections((secs) => {
      const without = secs.map((s) => {
        if (s.id !== fromSectionId) return s;
        const block = s.blocks.find((b) => b.id === blockId);
        if (block) moved = block;
        return { ...s, blocks: s.blocks.filter((b) => b.id !== blockId) };
      });
      if (!moved) return secs;
      return without.map((s) =>
        s.id === toSectionId ? { ...s, blocks: [...s.blocks, { ...moved!, order: s.blocks.length + 1 }] } : s,
      );
    });
  }

  function mergeWithNext(sectionId: string, blockId: string) {
    updateSections((secs) =>
      secs.map((s) => {
        if (s.id !== sectionId) return s;
        const sorted = s.blocks.slice().sort((a, b) => a.order - b.order);
        const idx = sorted.findIndex((b) => b.id === blockId);
        if (idx < 0 || idx >= sorted.length - 1) return s;
        const a = sorted[idx]!;
        const b = sorted[idx + 1]!;
        if (a.type === "paragraph" && b.type === "paragraph") {
          const merged: DocumentBlock = {
            ...a,
            text: `${a.text}\n\n${b.text}`.trim(),
          };
          const rest = sorted.filter((bl) => bl.id !== b.id).map((bl) => (bl.id === a.id ? merged : bl));
          return { ...s, blocks: rest.map((bl, i) => ({ ...bl, order: i + 1 })) };
        }
        return s;
      }),
    );
  }

  function splitParagraph(sectionId: string, blockId: string) {
    updateSections((secs) =>
      secs.map((s) => {
        if (s.id !== sectionId) return s;
        const block = s.blocks.find((b) => b.id === blockId);
        if (!block || block.type !== "paragraph") return s;
        const parts = block.text.split(/\n\n+/).filter(Boolean);
        if (parts.length < 2) return s;
        const newBlocks: DocumentBlock[] = parts.map((text, i) =>
          i === 0 ? { ...block, text } : { ...block, id: newId("split"), text },
        );
        const others = s.blocks.filter((b) => b.id !== blockId);
        return { ...s, blocks: [...others, ...newBlocks] };
      }),
    );
  }

  function removeBlock(sectionId: string, blockId: string) {
    updateSections((secs) =>
      secs.map((s) =>
        s.id === sectionId ? { ...s, blocks: s.blocks.filter((b) => b.id !== blockId) } : s,
      ),
    );
  }

  function addBlock(sectionId: string, type: DocumentBlockType) {
    updateSections((secs) =>
      secs.map((s) =>
        s.id === sectionId
          ? { ...s, blocks: [...s.blocks, { ...emptyBlock(type), order: s.blocks.length + 1 }] }
          : s,
      ),
    );
  }

  function addSection() {
    const id = newId("sec");
    updateSections((secs) => [
      ...secs,
      { id, order: secs.length + 1, title: "Nova seção", blocks: [] },
    ]);
    setExpandedSection(id);
  }

  async function uploadAsset(sectionId: string, blockId: string, file: File) {
    const fd = new FormData();
    fd.set("file", file);
    const res = await fetch(`/api/admin/dossier/${slug}/document/assets`, { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Falha no upload.");
    updateBlock(sectionId, blockId, {
      assetId: data.assetId,
      alt: blockId,
    } as Partial<DocumentBlock>);
  }

  const previewWidth = viewport === "mobile" ? 390 : 720;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`min-h-11 rounded px-3 text-sm ${viewport === "desktop" ? "bg-cm-red text-white" : "bg-cm-bg-low text-cm-gray"}`}
          onClick={() => setViewport("desktop")}
        >
          Prévia desktop
        </button>
        <button
          type="button"
          className={`min-h-11 rounded px-3 text-sm ${viewport === "mobile" ? "bg-cm-red text-white" : "bg-cm-bg-low text-cm-gray"}`}
          onClick={() => setViewport("mobile")}
        >
          Prévia 390px
        </button>
      </div>

      {document.meta.extractionWarnings.length > 0 ? (
        <ul className="rounded border border-amber-500/30 bg-amber-950/20 p-3 text-sm text-amber-100/90">
          {document.meta.extractionWarnings.map((w) => (
            <li key={w}>⚠ {w}</li>
          ))}
        </ul>
      ) : null}

      {sections.map((section) => (
        <section key={section.id} className="rounded border border-cm-divider">
          <header className="flex flex-wrap items-center gap-2 border-b border-cm-divider p-3">
            <button
              type="button"
              className="text-left text-sm font-semibold text-white"
              onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
            >
              {expandedSection === section.id ? "▼" : "▶"} Seção {section.order}
            </button>
            <input
              className="cm-input min-h-11 flex-1 text-sm"
              value={section.title ?? ""}
              placeholder="Título da seção"
              onChange={(e) =>
                updateSections((secs) =>
                  secs.map((s) => (s.id === section.id ? { ...s, title: e.target.value } : s)),
                )
              }
            />
            <select
              className="cm-input min-h-11 text-xs"
              aria-label="Mover bloco selecionado para seção"
              defaultValue=""
              onChange={(e) => {
                const blockId = e.target.dataset.blockId;
                if (blockId && e.target.value) {
                  moveBlockToSection(section.id, blockId, e.target.value);
                  e.target.value = "";
                }
              }}
            >
              <option value="">—</option>
            </select>
          </header>

          {expandedSection === section.id ? (
            <ol className="space-y-4 p-4">
              {section.blocks
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((block) => (
                  <li key={block.id} className="rounded border border-cm-divider/80 p-3">
                    <div className="mb-2 flex flex-wrap gap-2">
                      <select
                        className="cm-input min-h-11 text-xs"
                        value={block.type}
                        onChange={(e) => {
                          const t = e.target.value as DocumentBlockType;
                          updateBlock(section.id, block.id, emptyBlock(t));
                        }}
                      >
                        {BLOCK_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <button type="button" className="min-h-11 rounded border border-cm-divider px-2 text-xs" onClick={() => moveBlock(section.id, block.id, -1)}>
                        ↑
                      </button>
                      <button type="button" className="min-h-11 rounded border border-cm-divider px-2 text-xs" onClick={() => moveBlock(section.id, block.id, 1)}>
                        ↓
                      </button>
                      <button type="button" className="min-h-11 rounded border border-cm-divider px-2 text-xs" onClick={() => mergeWithNext(section.id, block.id)}>
                        Unir c/ próximo
                      </button>
                      <button type="button" className="min-h-11 rounded border border-cm-divider px-2 text-xs" onClick={() => splitParagraph(section.id, block.id)}>
                        Separar
                      </button>
                      <button type="button" className="min-h-11 rounded border border-cm-red/40 px-2 text-xs text-cm-red-light" onClick={() => removeBlock(section.id, block.id)}>
                        Remover
                      </button>
                      <select
                        className="cm-input min-h-11 text-xs"
                        aria-label="Mover para outra seção"
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) {
                            moveBlockToSection(section.id, block.id, e.target.value);
                            e.target.value = "";
                          }
                        }}
                      >
                        <option value="">Mover seção…</option>
                        {sections
                          .filter((s) => s.id !== section.id)
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.title ?? s.id}
                            </option>
                          ))}
                      </select>
                    </div>

                    <BlockFields
                      slug={slug}
                      block={block}
                      onPatch={(patch) => updateBlock(section.id, block.id, patch)}
                      onUpload={(file) => uploadAsset(section.id, block.id, file)}
                    />

                    <div
                      className="dossier-html-reader mt-4 overflow-hidden rounded bg-black/20 p-3"
                      style={{ maxWidth: previewWidth }}
                    >
                      <DocumentBlockView slug={slug} block={block} />
                    </div>
                  </li>
                ))}
              <div className="flex flex-wrap gap-2">
                <select
                  className="cm-input min-h-11 text-sm"
                  defaultValue="paragraph"
                  id={`add-block-${section.id}`}
                >
                  {BLOCK_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-11"
                  onClick={() => {
                    const sel = window.document.getElementById(`add-block-${section.id}`) as HTMLSelectElement;
                    addBlock(section.id, (sel?.value ?? "paragraph") as DocumentBlockType);
                  }}
                >
                  Adicionar bloco
                </Button>
              </div>
            </ol>
          ) : null}
        </section>
      ))}

      <Button type="button" variant="secondary" className="min-h-11" onClick={addSection}>
        Nova seção
      </Button>

      {versions.length > 0 ? (
        <details className="rounded border border-cm-divider p-4">
          <summary className="cursor-pointer text-sm text-cm-gray">Histórico de versões publicadas</summary>
          <ul className="mt-3 space-y-2 text-sm">
            {versions.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center gap-2">
                <span className="text-cm-gray">
                  v{v.version} — {new Date(v.publishedAt).toLocaleString("pt-BR")}
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-9 text-xs"
                  disabled={saving}
                  onClick={() => onSave("restore_version", { versionId: v.id })}
                >
                  Restaurar rascunho
                </Button>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="button" className="min-h-11" disabled={saving} onClick={() => onSave("save_draft")}>
          {saving ? "Salvando…" : "Salvar rascunho"}
        </Button>
        <Button type="button" variant="secondary" className="min-h-11" disabled={saving} onClick={() => onSave("publish")}>
          Publicar HTML
        </Button>
        <Button type="button" variant="secondary" className="min-h-11" disabled={saving} onClick={() => onSave("unpublish")}>
          Despublicar
        </Button>
        <Button type="button" variant="secondary" className="min-h-11" disabled={saving} onClick={() => onSave("new_version")}>
          Nova versão (rascunho)
        </Button>
      </div>
    </div>
  );
}

function BlockFields({
  slug,
  block,
  onPatch,
  onUpload,
}: {
  slug: string;
  block: DocumentBlock;
  onPatch: (patch: Partial<DocumentBlock>) => void;
  onUpload: (file: File) => Promise<void>;
}) {
  const [uploading, setUploading] = useState(false);
  void slug;

  if (block.type === "heading") {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-xs text-cm-gray">
          Nível
          <select
            className="cm-input mt-1 min-h-11 w-full"
            value={block.level}
            onChange={(e) => onPatch({ level: Number(e.target.value) as 1 | 2 | 3 })}
          >
            <option value={1}>H1</option>
            <option value={2}>H2</option>
            <option value={3}>H3</option>
          </select>
        </label>
        <label className="text-xs text-cm-gray sm:col-span-2">
          Texto
          <input className="cm-input mt-1 min-h-11 w-full" value={block.text} onChange={(e) => onPatch({ text: e.target.value })} />
        </label>
      </div>
    );
  }

  if (block.type === "paragraph" || block.type === "quote" || block.type === "callout") {
    return (
      <label className="block text-xs text-cm-gray">
        Texto
        <textarea className="cm-input mt-1 min-h-[88px] w-full" value={block.text} onChange={(e) => onPatch({ text: e.target.value })} />
      </label>
    );
  }

  if (block.type === "image" || block.type === "figure") {
    return (
      <div className="grid gap-2">
        <label className="text-xs text-cm-gray">
          assetId
          <input className="cm-input mt-1 min-h-11 w-full" value={block.assetId} onChange={(e) => onPatch({ assetId: e.target.value })} />
        </label>
        <label className="text-xs text-cm-gray">
          Alt
          <input className="cm-input mt-1 min-h-11 w-full" value={block.alt} onChange={(e) => onPatch({ alt: e.target.value })} />
        </label>
        <label className="text-xs text-cm-gray">
          Legenda
          <input
            className="cm-input mt-1 min-h-11 w-full"
            value={block.caption ?? ""}
            onChange={(e) => onPatch({ caption: e.target.value })}
          />
        </label>
        <label className="text-xs text-cm-gray">
          Crédito
          <input className="cm-input mt-1 min-h-11 w-full" value={block.credit ?? ""} onChange={(e) => onPatch({ credit: e.target.value })} />
        </label>
        <input
          type="file"
          accept="image/*"
          className="text-sm"
          disabled={uploading}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setUploading(true);
            try {
              await onUpload(f);
            } finally {
              setUploading(false);
            }
          }}
        />
        {block.assetId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/dossier/${slug}/document/asset/${encodeURIComponent(block.assetId)}?w=480`}
            alt={block.alt}
            className="max-h-48 w-full object-contain"
          />
        ) : null}
      </div>
    );
  }

  if (block.type === "list") {
    return (
      <label className="block text-xs text-cm-gray">
        Itens (um por linha)
        <textarea
          className="cm-input mt-1 min-h-[88px] w-full"
          value={block.items.join("\n")}
          onChange={(e) => onPatch({ items: e.target.value.split("\n") })}
        />
      </label>
    );
  }

  return (
    <p className="text-xs text-cm-gray">
      Edite campos avançados via tipo ou converta para parágrafo. Bloco: {block.type}
    </p>
  );
}
