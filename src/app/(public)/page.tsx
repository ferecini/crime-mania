import Link from "next/link";
import { EpisodeListItem } from "@/components/episodes/EpisodeListItem";
import { EditorialHero } from "@/components/home/EditorialHero";
import { RecentEpisodeStrip } from "@/components/home/RecentEpisodeStrip";
import { ProductVisual } from "@/components/shop/ProductVisual";
import { ButtonLink } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EditorialImage } from "@/components/visual/EditorialImage";
import { SHOP_PRODUCTS } from "@/data/products";
import {
  INSTAGRAM_URL,
  PUBLIC_EPISODES,
  SPOTIFY_SHOW_URL,
  YOUTUBE_CHANNEL_URL,
} from "@/data/episodes";
import { aboutPlaceholder } from "@/lib/visual/category-artwork";

export default function HomePage() {
  const latest = PUBLIC_EPISODES[0];
  const preview = PUBLIC_EPISODES.slice(1, 4);

  return (
    <>
      <EditorialHero />
      <RecentEpisodeStrip episode={latest} />

      <section id="sobre" className="cm-block bg-cm-bg-low">
        <div className="cm-container grid gap-12 lg:grid-cols-[minmax(0,0.95fr)_1.05fr] lg:items-center lg:gap-16">
          {/* Placeholder provisório — substituir pela foto oficial da Rafa quando disponível */}
          <div className="relative mx-auto aspect-[5/6] w-full max-w-md overflow-hidden rounded-[4px] lg:mx-0">
            <EditorialImage
              src={aboutPlaceholder}
              alt="Imagem provisória da apresentadora em estúdio"
              fill
              sizes="(max-width: 1024px) 90vw, 420px"
              className="object-cover object-[70%_center]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" aria-hidden />
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
          <div className="grid gap-8 md:grid-cols-2">
            {SHOP_PRODUCTS.map((product) => (
              <Link
                key={product.slug}
                href={`/shop/${product.slug}`}
                className="group overflow-hidden rounded-[4px] bg-cm-bg-low transition hover:bg-cm-bg-elevated"
              >
                <ProductVisual type={product.imagePlaceholder} />
                <div className="border-t border-cm-divider p-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cm-red">
                    Pré-venda
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white group-hover:text-cm-red-light">
                    {product.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-cm-gray">{product.shortDescription}</p>
                  <p className="mt-4 text-sm font-medium text-cm-gray">{product.listPriceLabel}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="cm-editorial-rule" aria-hidden />

      <section id="episodios" className="cm-block bg-cm-bg-low">
        <div className="cm-container">
          <SectionHeader
            kicker="Grátis"
            title="Episódios"
            description="Histórias investigativas em áudio — ouça no site ou nas plataformas."
          />

          <div className="mt-10 md:hidden">
            <EpisodeListItem episode={latest} index={0} variant="featured" />
          </div>

          <div className="mt-10 hidden md:block">
            <EpisodeListItem episode={latest} index={0} variant="featured" />
          </div>

          <div className="mt-12 lg:hidden">
            {preview.map((episode, i) => (
              <EpisodeListItem key={episode.slug} episode={episode} index={i + 1} variant="row" />
            ))}
          </div>
          <div className="mt-12 hidden gap-6 lg:grid lg:grid-cols-3">
            {preview.map((episode, i) => (
              <EpisodeListItem key={episode.slug} episode={episode} index={i + 1} variant="grid" />
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
