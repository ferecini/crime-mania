import type { DocumentBlock } from "@/lib/dossier/document-types";
import { DocumentFigureBlock } from "@/components/dossier/DocumentFigureBlock";
import { banfieldVitimasQuadrantFromPersonName } from "@/lib/dossier/banfield-vitimas-quadrants";

export function DocumentBlockView({
  slug,
  block,
  mapPanelLayout,
}: {
  slug: string;
  block: DocumentBlock;
  mapPanelLayout?: boolean;
}) {
  switch (block.type) {
    case "heading": {
      const Tag = block.level === 1 ? "h2" : block.level === 2 ? "h3" : "h4";
      const size =
        block.level === 1
          ? "text-3xl md:text-4xl"
          : block.level === 2
            ? "text-2xl md:text-3xl"
            : "text-xl md:text-2xl";
      return (
        <Tag className={`font-display ${size} text-white`}>{block.text}</Tag>
      );
    }
    case "paragraph":
      return <p className="text-[17px] leading-[1.65] text-cm-gray md:text-[18px]">{block.text}</p>;
    case "quote":
      return (
        <figure className="border-l-2 border-cm-red pl-4">
          <blockquote className="text-lg italic text-white">{block.text}</blockquote>
          {block.attribution ? (
            <figcaption className="mt-2 text-sm text-cm-gray">— {block.attribution}</figcaption>
          ) : null}
        </figure>
      );
    case "callout":
      return (
        <aside
          className={`rounded-[4px] border p-4 ${
            block.variant === "warning"
              ? "border-amber-500/40 bg-amber-950/30"
              : block.variant === "accent"
                ? "border-cm-red/40 bg-cm-red/10"
                : "border-cm-divider bg-white/5"
          }`}
        >
          {block.title ? <p className="font-display text-white">{block.title}</p> : null}
          <p className="mt-1 text-[17px] leading-relaxed text-cm-gray">{block.text}</p>
        </aside>
      );
    case "facts":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {block.title ? (
            <p className="font-display col-span-full text-lg text-white">{block.title}</p>
          ) : null}
          {block.items.map((item) => (
            <div
              key={`${item.label}-${item.value.slice(0, 24)}`}
              className="rounded-[4px] border border-cm-divider bg-black/20 p-4"
            >
              <p className="text-xs uppercase tracking-widest text-cm-red">{item.label}</p>
              <p className="mt-1 text-white">{item.value}</p>
            </div>
          ))}
        </div>
      );
    case "timeline":
      return (
        <div className="space-y-4">
          {block.title ? <h3 className="font-display text-xl text-white">{block.title}</h3> : null}
          {/* Mobile: trilho vertical à esquerda. md+: espinha central com cards alternados. */}
          <ol className="relative space-y-6 border-l border-cm-divider md:space-y-0 md:border-l-0 md:before:absolute md:before:inset-y-0 md:before:left-1/2 md:before:w-px md:before:-translate-x-1/2 md:before:bg-cm-divider">
            {block.entries.map((entry, i) => (
              <li
                key={`${i}-${entry.date}-${entry.title}`}
                className="relative pl-6 md:grid md:grid-cols-2 md:pb-10 md:pl-0 md:last:pb-0"
              >
                <span
                  aria-hidden
                  className="absolute left-0 top-1.5 size-3 -translate-x-1/2 rounded-full border-2 border-cm-red bg-cm-bg md:left-1/2 md:top-5"
                />
                <div
                  className={`min-w-0 rounded-[4px] border border-cm-divider bg-white/[0.03] p-4 md:p-5 ${
                    i % 2 === 0 ? "md:col-start-1 md:mr-10" : "md:col-start-2 md:ml-10"
                  }`}
                >
                  {entry.date ? (
                    <p className="text-xs font-semibold uppercase tracking-wider text-cm-red">{entry.date}</p>
                  ) : null}
                  {entry.title ? <p className="font-display mt-1 text-lg text-white">{entry.title}</p> : null}
                  {entry.assetId ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/dossier/${encodeURIComponent(slug)}/document/asset/${encodeURIComponent(entry.assetId)}?w=640`}
                      alt={entry.title}
                      loading="lazy"
                      decoding="async"
                      className="mt-3 h-auto w-full rounded-[4px] object-cover"
                    />
                  ) : null}
                  {entry.body ? (
                    <p className="mt-2 text-[15px] leading-relaxed text-cm-gray md:text-sm">{entry.body}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </div>
      );
    case "people": {
      const solo = block.items.length === 1;
      return (
        <div className="space-y-4">
          {block.title ? <h3 className="font-display text-xl text-white md:text-2xl">{block.title}</h3> : null}
          <ul
            className={`grid gap-4 ${solo ? "grid-cols-1" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"}`}
          >
            {block.items.map((p, i) => {
              const vitimasQ =
                slug === "familia-banfield" && p.assetId === "fig-vitimas"
                  ? banfieldVitimasQuadrantFromPersonName(p.name)
                  : null;
              const qParam = vitimasQ !== null ? `&q=${vitimasQ}` : "";
              return (
              <li key={`${i}-${p.name}`} className="min-w-0">
                {p.assetId && solo ? (
                  <DocumentFigureBlock
                    slug={slug}
                    assetId={p.assetId}
                    alt={p.name}
                    caption={[p.name, p.role].filter(Boolean).join(" — ")}
                    credit={p.credit}
                    vitimasQuadrant={vitimasQ ?? undefined}
                  />
                ) : (
                  <figure>
                    {p.assetId ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/dossier/${encodeURIComponent(slug)}/document/asset/${encodeURIComponent(p.assetId)}?w=480${qParam}`}
                        alt={p.name}
                        loading="lazy"
                        decoding="async"
                        className="aspect-[4/5] w-full rounded-[4px] border border-cm-divider bg-black/30 object-contain"
                      />
                    ) : null}
                    <figcaption className="mt-2">
                      <p className="font-display text-sm text-white">{p.name}</p>
                      {p.role ? <p className="text-xs text-cm-gray">{p.role}</p> : null}
                      {p.credit ? <p className="text-xs text-cm-gray">Crédito: {p.credit}</p> : null}
                    </figcaption>
                  </figure>
                )}
              </li>
            );
            })}
          </ul>
        </div>
      );
    }
    case "list":
      if (block.style === "ordered") {
        return (
          <ol className="list-decimal space-y-2 pl-5 text-[17px] leading-relaxed text-cm-gray">
            {block.items.map((item) => (
              <li key={item.slice(0, 40)}>{item}</li>
            ))}
          </ol>
        );
      }
      return (
        <ul className="list-disc space-y-2 pl-5 text-[17px] leading-relaxed text-cm-gray">
          {block.items.map((item) => (
            <li key={item.slice(0, 40)}>{item}</li>
          ))}
        </ul>
      );
    case "table":
      return (
        <figure className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr>
                {block.headers.map((h) => (
                  <th key={h} className="border border-cm-divider px-3 py-2 text-white">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="border border-cm-divider px-3 py-2 text-cm-gray">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {block.caption ? (
            <figcaption className="mt-2 text-sm text-cm-gray">{block.caption}</figcaption>
          ) : null}
        </figure>
      );
    case "image":
    case "figure": {
      const portrait = block.type === "image" && block.layout === "portrait";
      return (
        <DocumentFigureBlock
          slug={slug}
          assetId={block.assetId}
          alt={block.alt}
          caption={"caption" in block ? block.caption : undefined}
          credit={block.credit}
          portrait={portrait}
          mapPanelLayout={mapPanelLayout}
        />
      );
    }
    default:
      return null;
  }
}
