import { EpisodeListItem } from "@/components/episodes/EpisodeListItem";
import { ButtonLink } from "@/components/ui/Button";
import { PUBLIC_EPISODES } from "@/data/episodes";

export const metadata = { title: "Episódios" };

export default function EpisodesCatalogPage() {
  return (
    <div className="cm-block min-h-0 py-24">
      <div className="cm-container">
        <h1 className="font-display text-4xl text-white">Episódios</h1>
        <p className="mt-3 max-w-2xl text-cm-gray">
          Catálogo público com links e players específicos por episódio — sem reutilizar o URL
          geral do programa.
        </p>
        <div className="mt-10">
          {PUBLIC_EPISODES.map((episode) => (
            <EpisodeListItem key={episode.slug} episode={episode} />
          ))}
        </div>
        <ButtonLink href="/membro/planos" className="mt-10">
          Faça parte
        </ButtonLink>
      </div>
    </div>
  );
}
