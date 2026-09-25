import Image from "next/image";
import Link from "next/link";
import { Tag } from "@/components/ui/Tag";
import type { PublicEpisode } from "@/data/episodes";
import { formatEpisodeNumber } from "@/data/episodes";

export function EpisodeListItem({ episode }: { episode: PublicEpisode }) {
  const epLabel = formatEpisodeNumber(episode.number);
  return (
    <article className="cm-panel group p-4 transition hover:border-cm-red/25 md:p-5">
      <div className="flex flex-col gap-4 md:grid md:grid-cols-[5.5rem_1fr_auto] md:items-center md:gap-5">
        <div className="relative h-36 w-full overflow-hidden rounded-md border border-white/5 md:h-20 md:w-20">
          <Image
            src={episode.coverImage}
            alt=""
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 80px"
          />
        </div>

        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {epLabel && (
              <span className="font-display text-[10px] text-cm-gray">{epLabel}</span>
            )}
            <Tag>{episode.category}</Tag>
            <span className="text-xs text-cm-gray">{episode.duration}</span>
          </div>
          <h3 className="text-lg font-semibold leading-snug text-white group-hover:text-cm-red-light md:text-xl">
            <Link href={`/episodios/${episode.slug}`} className="hover:underline">
              {episode.title}
            </Link>
          </h3>
          <p className="line-clamp-3 text-sm leading-relaxed text-cm-gray md:line-clamp-2">
            {episode.summary}
          </p>
        </div>

        <Link
          href={`/episodios/${episode.slug}#player`}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-cm-red/30 bg-cm-red/10 px-4 text-sm font-semibold text-white transition hover:bg-cm-red/20 md:w-auto"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cm-red/20 text-xs" aria-hidden>
            ▶
          </span>
          Ouvir
        </Link>
      </div>
    </article>
  );
}
