import { MemberSectionHeader } from "@/components/member/MemberSectionHeader";
import { PaywallCard } from "@/components/member/PaywallCard";
import { MemberMediaEmptyState, MemberMediaPlayer } from "@/components/media/MemberMediaPlayer";
import { MEMBER_EPISODES } from "@/data/member-media";
import { getSession } from "@/lib/auth/session";
import { evaluateAccess } from "@/lib/paywall";

export const metadata = { title: "Episódios" };

export default async function MemberEpisodesPage() {
  const session = await getSession();
  const access = evaluateAccess(session, "exclusive");

  return (
    <div className="space-y-6">
      <MemberSectionHeader title="Episódios" description="Episódios para você" />
      {!access.allowed ? (
        <PaywallCard state={access} />
      ) : MEMBER_EPISODES.length === 0 ? (
        <MemberMediaEmptyState message="Em breve: episódios premium em áudio e vídeo para assinantes Tier 2." />
      ) : (
        <ul className="space-y-4">
          {MEMBER_EPISODES.map((item) => (
            <li key={item.id}>
              <MemberMediaPlayer item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
