import { MemberSectionHeader } from "@/components/member/MemberSectionHeader";
import { PaywallCard } from "@/components/member/PaywallCard";
import { MemberMediaEmptyState, MemberMediaPlayer } from "@/components/media/MemberMediaPlayer";
import { ARCHIVE_EPISODES } from "@/data/member-media";
import { getSession } from "@/lib/auth/session";
import { evaluateAccess } from "@/lib/paywall";

export const metadata = { title: "Arquivo" };

export default async function ArchivePage() {
  const session = await getSession();
  const access = evaluateAccess(session, "archive");

  return (
    <div className="space-y-6">
      <MemberSectionHeader
        title="Arquivo"
        description="Explore nosso acervo privado de episódios"
      />
      {!access.allowed ? (
        <PaywallCard state={access} />
      ) : ARCHIVE_EPISODES.length === 0 ? (
        <MemberMediaEmptyState message="O acervo privado está sendo migrado. Episódios extras aparecerão aqui com player protegido — não usamos YouTube público como único controle de acesso." />
      ) : (
        <ul className="space-y-4">
          {ARCHIVE_EPISODES.map((item) => (
            <li key={item.id}>
              <MemberMediaPlayer item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
