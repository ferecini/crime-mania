import Link from "next/link";
import { listDossierRecords } from "@/data/dossiers";

export default function AdminGalleriesIndexPage() {
  const dossiers = listDossierRecords();
  return (
    <ul className="divide-y divide-cm-divider rounded border border-cm-divider">
      {dossiers.map((d) => (
        <li key={d.slug} className="flex items-center justify-between p-4">
          <span className="text-white">{d.title}</span>
          <Link
            href={`/membro/admin/galerias/${d.slug}`}
            className="inline-flex min-h-11 items-center text-sm text-cm-red-light hover:text-white"
          >
            Editar galeria →
          </Link>
        </li>
      ))}
    </ul>
  );
}
