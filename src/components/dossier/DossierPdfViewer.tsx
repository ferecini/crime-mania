"use client";

export function DossierPdfViewer({ slug, title }: { slug: string; title: string }) {
  const src = `/api/media/dossier/${encodeURIComponent(slug)}`;
  return (
    <div className="w-full overflow-hidden rounded-[4px] border border-cm-divider bg-black/40">
      <object
        data={src}
        type="application/pdf"
        className="mx-auto block min-h-[70vh] w-full max-w-5xl"
        aria-label={`Documento PDF: ${title}`}
      >
        <iframe
          title={title}
          src={src}
          className="mx-auto block min-h-[70vh] w-full max-w-5xl"
        />
      </object>
      <p className="border-t border-cm-divider px-4 py-3 text-xs text-cm-gray">
        Use zoom do navegador ou tela cheia do visualizador para ampliar. Conteúdo entregue após
        verificação de assinatura — URL protegida.
      </p>
    </div>
  );
}
