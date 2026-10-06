import type { DocumentBlock } from "@/lib/dossier/document-types";
import { DocumentFigureBlock } from "@/components/dossier/DocumentFigureBlock";

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
          <ol className="relative space-y-6 border-l border-cm-divider pl-6 md:flex md:flex-row md:gap-6 md:overflow-x-auto md:border-l-0 md:border-t md:pl-0 md:pt-6">
            {block.entries.map((entry) => (
              <li
                key={`${entry.date}-${entry.title}`}
                className="md:min-w-[14rem] md:flex-1 md:border-l md:border-cm-divider md:pl-4 md:first:border-l-0 md:first:pl-0"
              >
                <p className="text-xs font-medium uppercase tracking-wider text-cm-red">{entry.date}</p>
                <p className="font-display mt-1 text-white">{entry.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-cm-gray">{entry.body}</p>
              </li>
            ))}
          </ol>
        </div>
      );
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
