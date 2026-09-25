import Image from "next/image";
import Link from "next/link";
import { EpisodeListItem } from "@/components/episodes/EpisodeListItem";
import { SpotifyEmbed } from "@/components/media/SpotifyEmbed";
import { ButtonLink } from "@/components/ui/Button";
import { SHOP_PRODUCTS } from "@/data/products";
import {
  INSTAGRAM_URL,
  PUBLIC_EPISODES,
  YOUTUBE_CHANNEL_URL,
} from "@/data/episodes";

const HOST_PORTRAIT =
  "https://d3t3ozftmdmh3i.cloudfront.net/production/podcast_uploaded_nologo/11162378/11162378-1613768383181-90894aebfa963.jpg";

export default function HomePage() {
  const featured = PUBLIC_EPISODES.slice(0, 4);

  return (
    <>
      {/* Bloco 1 — Convite */}
      <section id="top" className="cm-block bg-cm-bg">
        <div className="cm-container grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="order-2 space-y-6 lg:order-1">
            <p className="font-display text-sm text-cm-red">Crime Mania</p>
            <h1 className="font-display text-3xl leading-tight text-white sm:text-4xl lg:text-5xl">
              Oi, Crime Maníacos…
            </h1>
            <p className="text-lg text-white/90">Vamos seguir falando sobre true crime?</p>
            <p className="max-w-xl text-base leading-relaxed text-cm-gray">
              Quer conteúdos exclusivos, acesso aos nossos debates e mais informações sobre o
              universo do true crime?
            </p>
            <ButtonLink href="/entrar">Entre</ButtonLink>
          </div>
          <div className="order-1 relative mx-auto aspect-[4/5] w-full max-w-md lg:order-2 lg:max-w-lg">
            <div className="absolute -inset-3 rounded-sm bg-gradient-to-br from-cm-gray-dark/40 to-transparent" />
            <Image
              src={HOST_PORTRAIT}
              alt="Arte do podcast Crime Mania — substituir pela foto oficial da host quando disponível"
              fill
              className="relative rounded-sm object-cover object-center grayscale-[15%]"
              priority
              sizes="(max-width: 1024px) 100vw, 480px"
            />
          </div>
        </div>
      </section>

      <div className="cm-editorial-rule" aria-hidden />

      {/* Bloco 2 — O Crime Mania */}
      <section id="sobre" className="cm-block bg-cm-surface">
        <div className="cm-container grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <h2 className="font-display text-4xl text-white lg:text-5xl">O Crime Mania</h2>
            <p className="mt-4 text-xl text-cm-gray">
              O conteúdo feito para maníacos por true crime
            </p>
          </div>
          <div className="space-y-5 text-base leading-relaxed text-cm-gray">
            <p>
              Somos um podcast brasileiro de true crime em português, produzido pela audiosamba.
              Histórias verdadeiras apresentadas por Rafa — com tom investigativo, curioso e
              sofisticado, longe de sensacionalismo gore ou estética de terror.
            </p>
            <p>
              Rafaelle conduz narrativas que valorizam memória, contexto e inteligência editorial —
              para quem quer ir além do episódio sem perder credibilidade jornalística.
            </p>
            <ul className="flex flex-wrap gap-3 pt-2">
              <li>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-sm border border-cm-gray-dark px-4 py-2 text-sm text-white hover:border-cm-red"
                >
                  Instagram @crimemania
                </a>
              </li>
              <li>
                <a
                  href="https://podcasters.spotify.com/pod/show/guria-studios"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-sm border border-cm-gray-dark px-4 py-2 text-sm text-white hover:border-cm-red"
                >
                  Ouça no Spotify
                </a>
              </li>
              <li>
                <a
                  href={YOUTUBE_CHANNEL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-sm border border-cm-gray-dark px-4 py-2 text-sm text-white hover:border-cm-red"
                >
                  Veja no YouTube
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <div className="cm-editorial-rule" aria-hidden />

      {/* Bloco 3 — Merchandising */}
      <section id="shop" className="cm-block bg-cm-bg">
        <div className="cm-container">
          <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-display text-sm text-cm-red">Shop</p>
              <h2 className="font-display text-3xl text-white md:text-4xl">Merchandising</h2>
              <p className="mt-2 text-cm-gray">Produtos para compra — caneca e camiseta oficiais.</p>
            </div>
            <ButtonLink href="/shop" variant="secondary">
              Ver shop
            </ButtonLink>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {SHOP_PRODUCTS.map((product) => (
              <Link
                key={product.slug}
                href={`/shop/${product.slug}`}
                className="group rounded-sm border border-cm-gray-dark bg-cm-surface p-6 transition hover:border-cm-gray"
              >
                <div className="mb-4 flex h-40 items-center justify-center rounded-sm bg-cm-surface-elevated text-5xl text-cm-gray-dark">
                  {product.imagePlaceholder === "mug" ? "☕" : "👕"}
                </div>
                <h3 className="text-lg font-semibold text-white group-hover:text-cm-red-light">
                  {product.name}
                </h3>
                <p className="mt-2 text-sm text-cm-gray">{product.description}</p>
                <p className="mt-3 text-sm font-semibold text-white">{product.priceLabel}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="cm-editorial-rule" aria-hidden />

      {/* Bloco 4 — Episódios */}
      <section id="episodios" className="cm-block bg-cm-surface">
        <div className="cm-container">
          <div className="mb-8 max-w-2xl">
            <p className="font-display text-sm text-cm-red">Grátis</p>
            <h2 className="font-display text-3xl text-white md:text-4xl">Episódios</h2>
            <p className="mt-3 text-cm-gray">
              Episódios disponíveis no Spotify e YouTube, com player incorporado em cada página.
            </p>
          </div>

          <div className="mb-10 rounded-sm border border-cm-gray-dark bg-cm-bg p-4 md:p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-cm-gray">
              Destaque
            </p>
            <SpotifyEmbed
              episodeId={featured[0].spotifyEpisodeId}
              title={featured[0].title}
            />
          </div>

          <div className="divide-y divide-cm-gray-dark/50">
            {featured.map((episode) => (
              <EpisodeListItem key={episode.slug} episode={episode} />
            ))}
          </div>

          <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <ButtonLink href="/episodios" variant="secondary">
              Ver todos os episódios
            </ButtonLink>
            <ButtonLink href="/membro/planos">Faça parte</ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
