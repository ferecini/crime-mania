import Link from "next/link";
import { redirect } from "next/navigation";
import { MemberSectionHeader } from "@/components/member/MemberSectionHeader";
import { getFeaturedDossierSlug, listDossierRecords } from "@/data/dossiers";
import { getSession } from "@/lib/auth/session";

export const metadata = { title: "Dossiês" };

export default async function DossiersListPage({
  searchParams,
}: {
  searchParams: Promise<{ all?: string }>;
}) {
  const { all } = await searchParams;
  const featured = getFeaturedDossierSlug();
  if (!all) {
    redirect(`/membro/dossies/${featured}`);
  }

  await getSession();
  const dossiers = listDossierRecords();

  return (
    <div className="space-y-6">
      <MemberSectionHeader
        title="Dossiês"
        description="Informação, fatos e fotos."
      />
      <ul className="space-y-3">
        {dossiers.map((dossier) => (
          <li key={dossier.slug}>
            <Link
              href={`/membro/dossies/${dossier.slug}`}
              className="block rounded-[4px] border border-cm-divider p-4 hover:bg-white/5"
            >
              <p className="text-xs uppercase tracking-widest text-cm-red">{dossier.category}</p>
              <p className="font-semibold text-white">{dossier.title}</p>
              <p className="mt-1 text-sm text-cm-gray">{dossier.summary}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
