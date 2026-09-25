import Link from "next/link";
import type { PublicEpisode } from "@/data/episodes";
import { formatEpisodeNumber } from "@/data/episodes";
import { formatDateBR } from "@/lib/format";

export function RecentEpisodeStrip({ episode }: { episode: PublicEpisode }) {
  const epLabel = formatEpisodeNumber(episode.number);
  return (
    <div className="border-y border-cm-divider bg-cm-bg-low">
      <div className="cm-container flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-cm-red">
            Episódio recente
          </p>
          <p className="truncate text-sm text-cm-gray">
            <span className="text-cm-gray">{episode.category}</span>
            {epLabel && (
              <>
                {" "}
                · Ep. {epLabel}
              </>
            )}
            {episode.duration && episode.duration !== "—" && <> · {episode.duration}</>}
            {episode.publishedAt && <> · {formatDateBR(episode.publishedAt)}</>}
          </p>
          <p className="truncate text-base font-semibold text-white">{episode.title}</p>
        </div>
        <Link
          href={`/episodios/${episode.slug}#player`}
          className="cm-text-link inline-flex min-h-12 shrink-0 items-center justify-center text-sm font-semibold text-white"
        >
          Ouvir episódio →
        </Link>
      </div>
    </div>
  );
}
