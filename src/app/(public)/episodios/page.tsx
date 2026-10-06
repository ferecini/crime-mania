import { EpisodeListItem } from "@/components/episodes/EpisodeListItem";
import { ButtonLink } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getPublicEpisodes } from "@/data/episodes";
export const metadata = { title: "Episódios" };
export const revalidate = 1800;

export default async function EpisodesCatalogPage() {
  const episodes = await getPublicEpisodes();
  const [featured, ...rest] = episodes;

  return (
    <div className="cm-block min-h-0 pt-28">
      <div className="cm-container">
        <SectionHeader title="Episódios" description="Ouça aqui ou nas plataformas." />

        {featured && (
          <div className="mt-12 border-b border-cm-divider pb-12">
            <EpisodeListItem episode={featured} index={0} variant="featured" />
          </div>
        )}

        <div className="mt-10 lg:hidden">
          {rest.map((episode, i) => (
            <EpisodeListItem key={episode.slug} episode={episode} index={i + 1} variant="row" />
          ))}
        </div>

        <div className="mt-10 hidden gap-6 lg:grid lg:grid-cols-3">
          {rest.map((episode, i) => (
            <EpisodeListItem key={episode.slug} episode={episode} index={i + 1} variant="grid" />
          ))}
        </div>

        <ButtonLink href="/planos" className="mt-12">
          Faça parte
        </ButtonLink>
      </div>
    </div>
  );
}
