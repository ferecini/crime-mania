import type { PublicEpisode } from "@/data/episodes";

interface ListenAlsoLinksProps {
  episode: Pick<PublicEpisode, "appleUrl" | "deezerShowUrl">;
}

export function ListenAlsoLinks({ episode }: ListenAlsoLinksProps) {
  return (
    <p className="text-center text-xs text-cm-gray sm:text-left">
      <span className="text-cm-gray/90">Disponível também em: </span>
      <a
        href={episode.appleUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Abrir este episódio no Apple Podcasts (nova aba)"
        className="font-medium text-white/90 underline-offset-2 transition hover:text-cm-red-light hover:underline"
      >
        Apple Podcasts
      </a>
      <span className="mx-1.5 text-cm-gray/60" aria-hidden>
        ·
      </span>
      <a
        href={episode.deezerShowUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Abrir o programa Crime Mania no Deezer (nova aba)"
        className="font-medium text-white/90 underline-offset-2 transition hover:text-cm-red-light hover:underline"
      >
        Deezer
      </a>
    </p>
  );
}
