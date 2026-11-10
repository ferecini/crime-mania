import type { DocumentBlock, DossierDocumentSection } from "@/lib/dossier/document-types";
import { DocumentBlockView } from "@/components/dossier/DocumentBlockView";

function sortedBlocks(blocks: DocumentBlock[]) {
  return blocks.slice().sort((a, b) => a.order - b.order);
}

/** Renderização pura do dossiê (leitor de membros e prévia do admin). */
export function DossierDocumentView({
  slug,
  sections,
  warnings = [],
}: {
  slug: string;
  sections: DossierDocumentSection[];
  warnings?: string[];
}) {
  const ordered = sections.slice().sort((a, b) => a.order - b.order);
  const navItems = ordered.filter((s) => s.title && s.blocks.length > 0 && s.id !== "intro");

  return (
    <div className="dossier-html-reader mx-auto max-w-3xl space-y-10 px-4 pb-28 [scroll-padding-bottom:7rem] md:max-w-[42rem] md:px-0 lg:max-w-[52rem]">
      {warnings.length > 0 ? (
        <ul className="rounded border border-amber-500/30 bg-amber-950/20 p-3 text-sm text-amber-100/90">
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}

      {navItems.length > 2 ? (
        <nav
          aria-label="Seções do dossiê"
          className="sticky top-[3.75rem] z-10 -mx-4 md:top-[4.25rem] border-b border-cm-divider bg-cm-bg/95 px-4 py-2 backdrop-blur-sm md:mx-0 md:rounded-[4px] md:border"
        >
          <ul className="flex gap-2 overflow-x-auto text-xs">
            {navItems.map((s) => (
              <li key={s.id} className="shrink-0">
                <a
                  href={`#sec-${s.id}`}
                  className="inline-flex min-h-11 items-center rounded-[4px] border border-cm-divider/60 px-3 text-cm-gray hover:border-cm-divider hover:text-white"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {ordered.map((section) => {
        const blocks = sortedBlocks(section.blocks);

        if (section.kind === "phase") {
          return (
            <section
              key={section.id}
              id={`sec-${section.id}`}
              className="scroll-mt-32 md:scroll-mt-36 space-y-5 rounded-[4px] border border-cm-divider bg-white/[0.02] p-5 md:p-8"
              aria-labelledby={`sec-${section.id}-title`}
            >
              <header className="space-y-1">
                {section.label ? (
                  <p className="text-xs font-semibold uppercase tracking-widest text-cm-red">{section.label}</p>
                ) : null}
                {section.title ? (
                  <h2
                    id={`sec-${section.id}-title`}
                    className="font-display text-2xl text-white md:text-3xl"
                  >
                    {section.title}
                  </h2>
                ) : null}
              </header>
              {blocks.map((block) => (
                <DocumentBlockView key={block.id} slug={slug} block={block} />
              ))}
            </section>
          );
        }

        if (section.id === "mapa") {
          const prose = blocks.filter((b) => b.type !== "figure");
          const figures = blocks.filter((b) => b.type === "figure");
          return (
            <section
              key={section.id}
              id={`sec-${section.id}`}
              className="scroll-mt-32 md:scroll-mt-36 space-y-5"
              aria-label={section.title}
              data-dossier-section="mapa"
            >
              {prose.map((block) => (
                <DocumentBlockView key={block.id} slug={slug} block={block} />
              ))}
              <div className="flex min-w-0 flex-col gap-8">
                {figures.map((block) => (
                  <DocumentBlockView key={block.id} slug={slug} block={block} mapPanelLayout />
                ))}
              </div>
            </section>
          );
        }

        return (
          <section
            key={section.id}
            id={`sec-${section.id}`}
            className="scroll-mt-32 md:scroll-mt-36 space-y-5"
            aria-label={section.title}
          >
            {blocks.map((block) => (
              <DocumentBlockView key={block.id} slug={slug} block={block} />
            ))}
          </section>
        );
      })}
    </div>
  );
}
