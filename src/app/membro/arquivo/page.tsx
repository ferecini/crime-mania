import { MemberSectionHeader } from "@/components/member/MemberSectionHeader";
import { PaywallCard } from "@/components/member/PaywallCard";
import { getSession } from "@/lib/auth/session";
import { evaluateAccess } from "@/lib/paywall";
import { memberSectionArtwork } from "@/lib/visual/category-artwork";

export const metadata = { title: "Arquivo" };

export default async function ArchivePage() {
  const session = await getSession();
  const access = evaluateAccess(session, "archive");

  return (
    <div className="space-y-6">
      <MemberSectionHeader
        title="Arquivo"
        description="Casos não públicos, disponíveis somente em áudio para assinantes Tier 2."
        imageSrc={memberSectionArtwork.arquivo}
      />
      {!access.allowed ? (
        <PaywallCard state={access} />
      ) : (
        <div className="rounded-[4px] border border-cm-divider bg-cm-bg-low p-6">
          <p className="text-sm leading-relaxed text-cm-gray">
            O catálogo premium em áudio está sendo migrado para esta área. Em breve você verá fichas
            com player protegido por episódio.
          </p>
        </div>
      )}
    </div>
  );
}
