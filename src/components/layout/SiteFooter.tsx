import Link from "next/link";
import {
  APPLE_PODCAST_URL,
  DEEZER_SHOW_URL,
  INSTAGRAM_URL,
  SPOTIFY_SHOW_URL,
  YOUTUBE_CHANNEL_URL,
} from "@/data/episodes";

export function SiteFooter() {
  return (
    <footer className="border-t border-cm-divider bg-black px-[1.125rem] py-14 md:px-6 lg:px-[4.5rem]">
      <div className="cm-container grid gap-12 md:grid-cols-3">
        <div className="space-y-3">
          <p className="font-display text-sm text-white">Crime Mania</p>
          <p className="max-w-sm text-sm leading-relaxed text-cm-gray">
            Histórias verdadeiras para maníacos de true crime — jornalismo investigativo com tom
            pop, sofisticado e imersivo.
          </p>
        </div>
        <div>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-cm-gray">
            Navegação
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/#sobre" className="text-white/80 hover:text-white">
                Sobre
              </Link>
            </li>
            <li>
              <Link href="/shop" className="text-white/80 hover:text-white">
                Shop
              </Link>
            </li>
            <li>
              <Link href="/episodios" className="text-white/80 hover:text-white">
                Episódios
              </Link>
            </li>
            <li>
              <Link href="/membro/planos" className="text-white/80 hover:text-white">
                Planos
              </Link>
            </li>
            <li>
              <Link href="/entrar" className="text-white/80 hover:text-white">
                Entrar
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-cm-gray">
            Legal e plataformas
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/80 hover:text-white"
              >
                Instagram
              </a>
            </li>
            <li>
              <a
                href={SPOTIFY_SHOW_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/80 hover:text-white"
              >
                Spotify
              </a>
            </li>
            <li>
              <a
                href={APPLE_PODCAST_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/80 hover:text-white"
              >
                Apple Podcasts
              </a>
            </li>
            <li>
              <a
                href={DEEZER_SHOW_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/80 hover:text-white"
              >
                Deezer
              </a>
            </li>
            <li>
              <a
                href={YOUTUBE_CHANNEL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/80 hover:text-white"
              >
                YouTube
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="cm-container mt-10 border-t border-cm-divider pt-6 text-xs text-cm-gray">
        © {new Date().getFullYear()} Crime Mania · audiosamba
      </div>
    </footer>
  );
}
