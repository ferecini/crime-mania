import Link from "next/link";
import { INSTAGRAM_URL, YOUTUBE_CHANNEL_URL } from "@/data/episodes";

export function SiteFooter() {
  return (
    <footer className="border-t border-cm-gray-dark bg-cm-surface px-5 py-12 lg:px-8">
      <div className="cm-container grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <p className="font-display text-lg text-white">Crime Mania</p>
          <p className="max-w-sm text-sm leading-relaxed text-cm-gray">
            Histórias verdadeiras para quem é maníaco por crimes reais e true crime —
            jornalismo investigativo com tom pop, sofisticado e imersivo.
          </p>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-cm-gray">
            Navegação
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/#sobre" className="text-white/90 hover:text-white">
                Sobre
              </Link>
            </li>
            <li>
              <Link href="/shop" className="text-white/90 hover:text-white">
                Shop
              </Link>
            </li>
            <li>
              <Link href="/episodios" className="text-white/90 hover:text-white">
                Episódios
              </Link>
            </li>
            <li>
              <Link href="/entrar" className="text-white/90 hover:text-white">
                Entrar
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-cm-gray">
            Redes
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/90 hover:text-white"
              >
                Instagram @crimemania
              </a>
            </li>
            <li>
              <a
                href={YOUTUBE_CHANNEL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/90 hover:text-white"
              >
                YouTube
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-cm-gray">
            Membros
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/membro" className="text-white/90 hover:text-white">
                Área logada
              </Link>
            </li>
            <li>
              <Link href="/membro/planos" className="text-white/90 hover:text-white">
                Planos
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="cm-container mt-10 border-t border-cm-gray-dark/60 pt-6 text-xs text-cm-gray">
        © {new Date().getFullYear()} Crime Mania · audiosamba
      </div>
    </footer>
  );
}
