import { MemberSectionHeader } from "@/components/member/MemberSectionHeader";
import { PaywallCard } from "@/components/member/PaywallCard";
import { MemberMediaEmptyState, MemberMediaPlayer } from "@/components/media/MemberMediaPlayer";
import { JURIS_CATALOG } from "@/data/member-media";
import { getSession } from "@/lib/auth/session";
import { evaluateAccess } from "@/lib/paywall";

export const metadata = { title: "Crime Mania Juris" };

export default async function JurisPage() {
  const session = await getSession();
  const access = evaluateAccess(session, "jurisCatalog");

  return (
    <div className="space-y-6">
      <MemberSectionHeader
        title="Crime Mania Juris"
        description="Episódios selecionados comentados por especialistas."
      />
      {!access.allowed ? (
        <PaywallCard state={access} />
      ) : JURIS_CATALOG.length === 0 ? (
        <MemberMediaEmptyState message="Catálogo Juris em preparação — novos conteúdos serão publicados pela equipe." />
      ) : (
        <ul className="space-y-4">
          {JURIS_CATALOG.map((item) => (
            <li key={item.id}>
              <MemberMediaPlayer item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
