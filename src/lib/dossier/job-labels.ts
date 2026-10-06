/** Ordem preferida no painel admin (mais urgentes primeiro). */
export const DOSSIER_JOB_STATUS_DISPLAY_ORDER = [
  "processing",
  "uploaded",
  "needs_review",
  "failed",
  "published",
] as const;

const STATUS: Record<string, string> = {
  uploaded: "PDF recebido",
  processing: "Processando",
  needs_review: "Aguardando revisão editorial",
  failed: "Falhou",
  published: "Publicado",
};

const PROGRESS: Record<string, string> = {
  download_pdf: "baixando PDF",
  render: "renderizando páginas",
  extract_html: "extraindo documento HTML",
  html_extract_failed: "extração HTML incompleta",
  done: "concluído",
  error: "erro",
};

export function dossierJobStatusLabel(status: string): string {
  return STATUS[status] ?? status;
}

export function dossierJobProgressLabel(progress: string | undefined): string {
  if (!progress) return "";
  return PROGRESS[progress] ?? progress.replace(/_/g, " ");
}
