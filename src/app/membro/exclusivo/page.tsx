import { MemberSectionHeader } from "@/components/member/MemberSectionHeader";
import { PaywallCard } from "@/components/member/PaywallCard";
import { getSession } from "@/lib/auth/session";
import { evaluateAccess } from "@/lib/paywall";
import { memberSectionArtwork } from "@/lib/visual/category-artwork";

export const metadata = { title: "Conteúdo exclusivo" };

export default async function ExclusivePage() {
  const session = await getSession();
  const access = evaluateAccess(session, "exclusive");

  return (
    <div className="space-y-6">
      <MemberSectionHeader
        title="Conteúdo exclusivo"
        description="Episódios extras ou newsletter em áudio e vídeo — Tier 2."
        imageSrc={memberSectionArtwork.exclusivo}
      />
      {!access.allowed ? (
        <PaywallCard state={access} />
      ) : (
        <p className="text-sm text-cm-gray">Nenhum item publicado ainda.</p>
      )}
    </div>
  );
}
