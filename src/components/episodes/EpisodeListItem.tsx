import Image from "next/image";
import Link from "next/link";
import type { PublicEpisode } from "@/data/episodes";

export function EpisodeListItem({ episode }: { episode: PublicEpisode }) {
  return (
    <article className="group grid gap-4 border-b border-cm-gray-dark/70 py-6 transition-colors hover:bg-cm-surface/40 md:grid-cols-[auto_1fr_auto] md:items-center md:gap-6 md:px-4">
      <div className="flex items-center gap-3 md:flex-col md:items-start md:gap-1">
        <span className="font-display text-xs text-cm-gray">
          {String(episode.number).padStart(3, "0")}
        </span>
        <span className="rounded-sm border border-cm-gray-dark px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cm-gray">
          {episode.category}
        </span>
        <span className="text-xs text-cm-gray">{episode.duration}</span>
      </div>
      <div className="flex min-w-0 gap-4">
        <div className="relative hidden h-16 w-16 shrink-0 overflow-hidden rounded-sm border border-cm-gray-dark sm:block">
          <Image
            src={episode.coverImage}
            alt=""
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold leading-snug text-white group-hover:text-cm-red-light md:text-lg">
            <Link href={`/episodios/${episode.slug}`} className="hover:underline">
              {episode.title}
            </Link>
          </h3>
          <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-cm-gray md:line-clamp-2">
            {episode.summary}
          </p>
        </div>
      </div>
      <Link
        href={`/episodios/${episode.slug}#player`}
        className="inline-flex items-center gap-2 self-start text-sm font-semibold text-cm-red hover:text-cm-red-light md:self-center"
      >
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full border border-cm-red/40 bg-cm-red/10"
          aria-hidden
        >
          ▶
        </span>
        Ouvir
      </Link>
    </article>
  );
}
