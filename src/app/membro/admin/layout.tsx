import { redirect } from "next/navigation";
import Link from "next/link";
import { isDossierAdmin } from "@/lib/dossier/admin-access";
import { getSession } from "@/lib/auth/session";

const ADMIN_LINKS = [
  { href: "/membro/admin", label: "Painel" },
  { href: "/membro/admin/dossiers", label: "Dossiês" },
  { href: "/membro/admin/galerias", label: "Galerias" },
  { href: "/membro/admin/midias", label: "Mídias" },
  { href: "/membro/admin/auditoria", label: "Auditoria" },
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/entrar?next=/membro/admin");
  if (!isDossierAdmin(session)) {
    return (
      <main className="py-16 text-sm text-cm-gray">
        Acesso restrito à equipe editorial (CM_DOSSIER_ADMIN_IDS).
      </main>
    );
  }

  return (
    <div className="space-y-8">
      <header className="border-b border-cm-divider pb-6">
        <p className="text-xs uppercase tracking-widest text-cm-red">Administração</p>
        <h1 className="font-display mt-2 text-2xl text-white">Área editorial</h1>
        <nav className="mt-4 flex flex-wrap gap-2" aria-label="Administração">
          {ADMIN_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="inline-flex min-h-11 items-center rounded border border-cm-divider px-3 text-sm text-cm-gray hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </header>
      {children}
    </div>
  );
}
