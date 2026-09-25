import Link from "next/link";
import Image from "next/image";
import { PaywallCard } from "@/components/member/PaywallCard";
import { DOSSIER_PREVIEWS } from "@/data/dossiers";
import { getSession } from "@/lib/auth/session";
import { evaluateAccess } from "@/lib/paywall";

export const metadata = { title: "Dossiês" };

export default async function DossiersListPage() {
  const session = await getSession();
  const access = evaluateAccess(session, "dossierSummary");

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl text-white">Dossiês</h1>
      {!access.allowed && <PaywallCard state={access} />}
      <div className="grid gap-4 md:grid-cols-2">
        {DOSSIER_PREVIEWS.map((dossier) => (
          <Link
            key={dossier.slug}
            href={`/membro/dossies/${dossier.slug}`}
            className="flex gap-4 rounded-sm border border-cm-gray-dark bg-cm-surface p-4 hover:border-cm-gray"
          >
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-sm">
              <Image src={dossier.coverImage} alt="" fill className="object-cover" sizes="96px" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-cm-gray">{dossier.category}</p>
              <h2 className="font-semibold text-white">{dossier.title}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-cm-gray">{dossier.intro}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
