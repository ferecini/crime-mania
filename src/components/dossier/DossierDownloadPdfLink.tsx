export function DossierDownloadPdfLink({ slug, title }: { slug: string; title: string }) {
  const href = `/api/media/dossier/${encodeURIComponent(slug)}?download=1`;
  return (
    <p className="text-center">
      <a
        href={href}
        className="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-cm-divider px-4 py-2 text-sm text-cm-gray transition hover:border-cm-red hover:text-white"
      >
        Baixar PDF — {title}
      </a>
    </p>
  );
}
