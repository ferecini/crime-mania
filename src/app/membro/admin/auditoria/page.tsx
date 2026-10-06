import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  let rows: { action: string; slug: string | null; created_at: Date }[] = [];
  try {
    const url = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
    if (url) {
      const sql = neon(url);
      rows = (await sql`
        SELECT action, slug, created_at FROM dossier_admin_audit
        ORDER BY created_at DESC LIMIT 50
      `) as typeof rows;
    }
  } catch {
    rows = [];
  }

  return (
    <div className="overflow-x-auto rounded border border-cm-divider">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-cm-divider text-cm-gray">
            <th className="p-3">Quando</th>
            <th className="p-3">Ação</th>
            <th className="p-3">Slug</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-cm-divider/50">
              <td className="p-3 text-cm-gray">{new Date(r.created_at).toLocaleString("pt-BR")}</td>
              <td className="p-3 text-white">{r.action}</td>
              <td className="p-3 text-cm-gray">{r.slug ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
