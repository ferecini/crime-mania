import Link from "next/link";
import type { PublicEpisode } from "@/data/episodes";
import { formatEpisodeNumber } from "@/data/episodes";
import { formatDateBR } from "@/lib/format";
import { EpisodeCover } from "@/components/episodes/EpisodeCover";

type EpisodeListItemProps = {
  episode: PublicEpisode;
  index?: number;
  variant?: "grid" | "featured" | "row";
};

export function EpisodeListItem({
  episode,
  index = 0,
  variant = "row",
}: EpisodeListItemProps) {
  const epLabel = formatEpisodeNumber(episode.number);

  if (variant === "featured") {
    return (
      <article className="group grid gap-5 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-stretch">
        <Link href={`/episodios/${episode.slug}`} className="block min-h-[280px]">
          <EpisodeCover episode={episode} index={index} variant="feature" className="h-full min-h-[280px]" />
        </Link>
        <div className="flex flex-col justify-center py-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cm-red">
            {episode.category}
          </p>
          {epLabel && (
            <p className="mt-1 text-[10px] uppercase tracking-widest text-cm-gray">Ep. {epLabel}</p>
          )}
          <h2 className="font-display mt-3 text-2xl leading-tight text-white md:text-3xl">
            <Link href={`/episodios/${episode.slug}`} className="hover:text-cm-red-light">
              {episode.title}
            </Link>
          </h2>
          {episode.publishedAt && (
            <p className="mt-2 text-xs text-cm-gray">
              {episode.duration !== "—" ? `${episode.duration} · ` : ""}
              {formatDateBR(episode.publishedAt)}
            </p>
          )}
          <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-cm-gray">{episode.summary}</p>
          <Link
            href={`/episodios/${episode.slug}#player`}
            className="cm-text-link mt-6 inline-flex min-h-12 items-center text-sm font-semibold text-white"
          >
            Ouvir episódio →
          </Link>
        </div>
      </article>
    );
  }

  if (variant === "grid") {
    return (
      <article className="group">
        <Link href={`/episodios/${episode.slug}`} className="block">
          <EpisodeCover episode={episode} index={index} variant="compact" className="w-full" />
          <div className="mt-3 space-y-1 border-t border-cm-divider pt-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cm-red">
              {episode.category}
            </p>
            <h3 className="text-base font-semibold leading-snug text-white group-hover:text-cm-red-light">
              {episode.title}
            </h3>
            {episode.publishedAt && (
              <p className="text-xs text-cm-gray">{formatDateBR(episode.publishedAt)}</p>
            )}
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className="group border-b border-cm-divider py-4 last:border-b-0">
      <div className="flex gap-4">
        <Link
          href={`/episodios/${episode.slug}`}
          className="relative h-28 w-28 shrink-0 overflow-hidden rounded-[4px] sm:h-[7rem] sm:w-[7rem]"
        >
          <EpisodeCover episode={episode} index={index} variant="compact" className="h-full w-full" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] uppercase tracking-wider">
            <span className="font-semibold text-cm-red">{episode.category}</span>
            {epLabel && <span className="text-cm-gray">Ep. {epLabel}</span>}
            {episode.publishedAt && (
              <span className="text-cm-gray">{formatDateBR(episode.publishedAt)}</span>
            )}
          </div>
          <h3 className="mt-2 text-lg font-semibold leading-snug text-white group-hover:text-cm-red-light">
            <Link href={`/episodios/${episode.slug}`}>{episode.title}</Link>
          </h3>
          <Link
            href={`/episodios/${episode.slug}#player`}
            className="cm-text-link mt-3 inline-flex min-h-11 items-center text-xs font-semibold text-cm-gray hover:text-white"
          >
            Ouvir →
          </Link>
        </div>
      </div>
    </article>
  );
}
