import Image from "next/image";
import Link from "next/link";
import { EpisodeListItem } from "@/components/episodes/EpisodeListItem";
import { EpisodePlayer } from "@/components/media/EpisodePlayer";
import { ProductVisual } from "@/components/shop/ProductVisual";
import { ButtonLink } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SHOP_PRODUCTS } from "@/data/products";
import {
  INSTAGRAM_URL,
  PUBLIC_EPISODES,
  SPOTIFY_SHOW_URL,
  YOUTUBE_CHANNEL_URL,
} from "@/data/episodes";

const HOST_PORTRAIT =
  "https://d3t3ozftmdmh3i.cloudfront.net/production/podcast_uploaded_nologo/11162378/11162378-1613768383181-90894aebfa963.jpg";

export default function HomePage() {
  const featured = PUBLIC_EPISODES.slice(0, 4);
  const highlight = featured[0];

  return (
    <>
      <section id="top" className="cm-block cm-hero-bg overflow-hidden">
        <div className="cm-container grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div className="order-1 space-y-6 lg:order-1">
            <p className="font-display text-xs tracking-[0.4em] text-cm-red md:text-sm">
              True crime editorial
            </p>
            <h1 className="font-display max-w-xl text-[2rem] leading-[1.05] text-white sm:text-5xl lg:text-6xl">
              Oi, Crime Maníacos…
            </h1>
            <p className="text-lg text-white/90 md:text-xl">
              Vamos seguir falando sobre true crime?
            </p>
            <p className="max-w-lg text-base leading-relaxed text-cm-gray md:text-lg">
              Quer conteúdos exclusivos, acesso aos nossos debates e mais informações sobre o
              universo do true crime?
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <ButtonLink href="/membro/planos">Faça parte</ButtonLink>
              <ButtonLink href="/entrar" variant="secondary">
                Entrar
              </ButtonLink>
            </div>
          </div>

          <div className="order-2 w-full lg:order-2">
            <div className="cm-portrait-frame mx-auto aspect-[5/6] max-h-[min(70vh,520px)] w-full max-w-md lg:max-w-none">
              <Image
                src={HOST_PORTRAIT}
                alt="Identidade visual Crime Mania"
                fill
                className="object-cover object-center"
                priority
                sizes="(max-width: 1024px) 90vw, 480px"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="cm-editorial-rule" aria-hidden />

      <section id="sobre" className="cm-block bg-cm-bg-elevated">
        <div className="cm-container grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="cm-portrait-frame relative mx-auto aspect-[4/5] w-full max-w-sm lg:mx-0 lg:max-w-md">
            <Image
              src={HOST_PORTRAIT}
              alt="Crime Mania — podcast"
              fill
              className="object-cover object-top"
              sizes="(max-width: 1024px) 320px, 384px"
            />
          </div>
          <div>
            <SectionHeader
              kicker="Sobre"
              title="O Crime Mania"
              description="O conteúdo feito para maníacos por true crime"
            />
            <div className="mt-8 space-y-5 text-base leading-relaxed text-cm-gray md:text-[1.05rem]">
              <p>
                Somos um podcast brasileiro de true crime em português, produzido pela audiosamba.
                Histórias verdadeiras apresentadas por Rafa — investigação, curiosidade e
                sofisticação, longe de sensacionalismo gore ou estética de terror.
              </p>
              <p>
                Rafa conduz narrativas que valorizam memória, contexto e inteligência editorial — para
              quem quer ir além do episódio com credibilidade jornalística.
              </p>
            </div>
            <ul className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <li>
                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="cm-social-link">
                  Instagram @crimemania
                </a>
              </li>
              <li>
                <a href={SPOTIFY_SHOW_URL} target="_blank" rel="noopener noreferrer" className="cm-social-link">
                  Spotify
                </a>
              </li>
              <li>
                <a href={YOUTUBE_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="cm-social-link">
                  YouTube
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <div className="cm-editorial-rule" aria-hidden />

      <section id="shop" className="cm-block">
        <div className="cm-container">
          <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionHeader kicker="Shop" title="Merchandising" description="Produtos oficiais Crime Mania." />
            <ButtonLink href="/shop" variant="secondary" className="shrink-0">
              Ver shop
            </ButtonLink>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {SHOP_PRODUCTS.map((product) => (
              <Link
                key={product.slug}
                href={`/shop/${product.slug}`}
                className="cm-panel group overflow-hidden transition hover:border-cm-red/30"
              >
                <ProductVisual type={product.imagePlaceholder} />
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white group-hover:text-cm-red-light">
                    {product.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-cm-gray">{product.shortDescription}</p>
                  <p className="mt-4 text-sm font-semibold text-white">{product.listPriceLabel}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="cm-editorial-rule" aria-hidden />

      <section id="episodios" className="cm-block bg-cm-bg-elevated">
        <div className="cm-container">
          <SectionHeader
            kicker="Grátis"
            title="Episódios"
            description="Ouça no site, no Spotify ou acesse cada caso com mais contexto na área de membros."
          />

          <div className="mt-10 cm-panel cm-panel-glow p-4 md:p-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-cm-gray">
              Em destaque · {highlight.category}
            </p>
            <EpisodePlayer episode={highlight} />
          </div>

          <div className="mt-8 space-y-2">
            {featured.map((episode) => (
              <EpisodeListItem key={episode.slug} episode={episode} />
            ))}
          </div>

          <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <ButtonLink href="/episodios" variant="secondary">
              Ver catálogo completo
            </ButtonLink>
            <ButtonLink href="/membro/planos">Faça parte</ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
