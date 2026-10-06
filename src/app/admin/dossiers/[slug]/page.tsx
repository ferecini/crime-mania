import { redirect } from "next/navigation";

export default async function LegacyAdminDossierRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/membro/admin/dossiers/${slug}`);
}
