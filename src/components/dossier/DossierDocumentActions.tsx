"use client";

import { Button } from "@/components/ui/Button";

export type DocumentVersionSummary = { id: string; version: number; publishedAt: string };

export type DocumentSaveAction =
  | "save_draft"
  | "publish"
  | "unpublish"
  | "new_version"
  | "restore_version";

export type DocumentSaveHandler = (action: DocumentSaveAction, extra?: { versionId?: string }) => Promise<void>;

/** Barra de ações (rascunho / publicar / versões) compartilhada pelo formulário e pelo editor de blocos. */
export function DossierDocumentActions({
  slug,
  versions,
  onSave,
  saving,
}: {
  slug: string;
  versions: DocumentVersionSummary[];
  onSave: DocumentSaveHandler;
  saving: boolean;
}) {
  return (
    <div className="space-y-4">
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
        <a
          href={`/membro/admin/dossiers/${slug}/previa`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center rounded-[4px] border border-cm-divider px-4 text-sm font-semibold text-white hover:border-cm-gray"
        >
          Ver prévia (rascunho salvo)
        </a>
        <Button type="button" variant="secondary" className="min-h-11" disabled={saving} onClick={() => onSave("publish")}>
          Publicar
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
