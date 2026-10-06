import { notFound } from "next/navigation";
import { GalleryAdminPanel } from "@/components/admin/GalleryAdminPanel";
import { getDossierRecord } from "@/data/dossiers";

export default async function AdminGalleryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dossier = getDossierRecord(slug);
  if (!dossier) notFound();
  return <GalleryAdminPanel slug={slug} title={dossier.title} />;
}
