import { EpisodeListItem } from "@/components/episodes/EpisodeListItem";
import { ButtonLink } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PUBLIC_EPISODES } from "@/data/episodes";

export const metadata = { title: "Episódios" };

export default function EpisodesCatalogPage() {
  return (
    <div className="cm-block min-h-0 py-24">
      <div className="cm-container">
        <SectionHeader
          kicker="Catálogo"
          title="Episódios"
          description="Histórias investigativas em áudio — cada item com player e link específico no Spotify."
        />
        <div className="mt-10 space-y-3">
          {PUBLIC_EPISODES.map((episode) => (
            <EpisodeListItem key={episode.slug} episode={episode} />
          ))}
        </div>
        <ButtonLink href="/membro/planos" className="mt-12">
          Faça parte
        </ButtonLink>
      </div>
    </div>
  );
}
