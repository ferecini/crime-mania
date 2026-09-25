import Link from "next/link";
import Image from "next/image";
import { MemberSectionHeader } from "@/components/member/MemberSectionHeader";
import { PaywallCard } from "@/components/member/PaywallCard";
import { DOSSIER_PREVIEWS } from "@/data/dossiers";
import { getSession } from "@/lib/auth/session";
import { evaluateAccess } from "@/lib/paywall";
import { memberSectionArtwork } from "@/lib/visual/category-artwork";

export const metadata = { title: "Dossiês" };

export default async function DossiersListPage() {
  const session = await getSession();
  const access = evaluateAccess(session, "dossierSummary");

  return (
    <div className="space-y-8">
      <MemberSectionHeader
        title="Dossiês"
        description="Linha do tempo, fatos, documentos e fontes complementares aos episódios públicos."
        imageSrc={memberSectionArtwork.dossies}
      />
      {!access.allowed && <PaywallCard state={access} />}
      <div className="grid gap-4 md:grid-cols-2">
        {DOSSIER_PREVIEWS.map((dossier) => (
          <Link
            key={dossier.slug}
            href={`/membro/dossies/${dossier.slug}`}
            className="flex gap-4 rounded-[4px] border border-cm-divider bg-cm-bg-low p-4 transition hover:bg-cm-bg-elevated"
          >
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[4px]">
              <Image src={memberSectionArtwork.dossies} alt="" fill className="object-cover" sizes="96px" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-cm-red">{dossier.category}</p>
              <h2 className="font-semibold text-white">{dossier.title}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-cm-gray">{dossier.intro}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
