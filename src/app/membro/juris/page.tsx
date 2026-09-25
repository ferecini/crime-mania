import { MemberSectionHeader } from "@/components/member/MemberSectionHeader";
import { PaywallCard } from "@/components/member/PaywallCard";
import { getSession } from "@/lib/auth/session";
import { evaluateAccess } from "@/lib/paywall";
import { memberSectionArtwork } from "@/lib/visual/category-artwork";

export const metadata = { title: "Crime Mania Juris" };

export default async function JurisPage() {
  const session = await getSession();
  const access = evaluateAccess(session, "jurisCatalog");

  return (
    <div className="space-y-6">
      <MemberSectionHeader
        title="Crime Mania Juris"
        description="Conteúdo jurídico em catálogo dedicado — Tier 2."
        imageSrc={memberSectionArtwork.juris}
      />
      {!access.allowed ? (
        <PaywallCard state={access} />
      ) : (
        <p className="text-sm text-cm-gray">Catálogo Juris em preparação.</p>
      )}
    </div>
  );
}
