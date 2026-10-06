import Link from "next/link";
import { EpisodeListItem } from "@/components/episodes/EpisodeListItem";
import { EditorialHero } from "@/components/home/EditorialHero";
import { RecentEpisodeStrip } from "@/components/home/RecentEpisodeStrip";
import { ProductVisual } from "@/components/shop/ProductVisual";
import { PlatformSocialLinks } from "@/components/social/PlatformSocialLinks";
import { ButtonLink } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SHOP_PRODUCTS } from "@/data/products";
import { getPublicEpisodes } from "@/data/episodes";
/** ISR catálogo — alinhar com EPISODE_REVALIDATE_SECONDS no servidor */
export const revalidate = 1800;

export default async function HomePage() {
  const episodes = await getPublicEpisodes();
  const latest = episodes[0];
  const preview = episodes.slice(1, 4);

  return (
    <>
      <EditorialHero />
      {latest && <RecentEpisodeStrip episode={latest} />}

      <section id="sobre" className="cm-block bg-cm-bg-low">
        <div className="cm-container max-w-3xl">
          <h2 className="font-display text-3xl leading-tight text-white md:text-4xl lg:text-5xl">
            O CRIME MANIA
          </h2>
          <p className="mt-4 text-lg font-bold leading-relaxed text-white md:text-xl">
            O conteúdo feito para maníacos por true crime.
          </p>
          <p className="mt-6 text-base font-bold leading-relaxed text-cm-gray md:text-lg">
            Somos um podcast de true crime que transforma casos em conversa. Histórias verdadeiras
            sobre assassinatos, mortes misteriosas e desaparecimentos apresentadas por Rafa, que
            conduz narrativas cheias de curiosidade e investigação. Aqui valorizamos a memória e o
            respeito às vítimas. Para os verdadeiros fãs de true crime que querem se manter
            informados.
          </p>
          <PlatformSocialLinks className="mt-8" />
        </div>
      </section>

      <div className="cm-editorial-rule" aria-hidden />

      <section id="shop" className="cm-block">
        <div className="cm-container">
          <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionHeader title="Shop" description="Produtos oficiais Crime Mania." />
            <ButtonLink href="/shop" variant="secondary" className="min-h-11 shrink-0">
              Ver produtos
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

      <section className="cm-block bg-cm-bg">
        <div className="cm-container max-w-2xl">
          <SectionHeader
            title="Membros"
            description="Acesse nossos conteúdos exclusivos, debates e mais informações sobre o universo do true crime."
          />
          <ButtonLink href="/planos" className="mt-8 min-h-11">
            Faça parte
          </ButtonLink>
        </div>
      </section>

      <div className="cm-editorial-rule" aria-hidden />

      {latest && (
        <section id="episodios" className="cm-block bg-cm-bg-low">
          <div className="cm-container">
            <SectionHeader title="Episódios" description="Ouça aqui ou nas plataformas." />

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

            <ButtonLink href="/episodios" variant="secondary" className="mt-12 min-h-11">
              Ver catálogo completo
            </ButtonLink>
          </div>
        </section>
      )}
    </>
  );
}
