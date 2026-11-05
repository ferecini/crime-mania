import { neon } from "@neondatabase/serverless";

/** Auditoria operacional apenas — NÃO é fonte de verdade de entitlements. */
function getSql() {
  const url = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("POSTGRES_URL é obrigatório para spotify_soa_links.");
  return neon(url);
}

export async function hasSpotifySoaLink(userId: string): Promise<boolean> {
  const sql = getSql();
  const rows = await sql`SELECT 1 FROM spotify_soa_links WHERE user_id = ${userId}`;
  return rows.length > 0;
}

export async function upsertSpotifySoaLink(userId: string, entitlements: string[]): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO spotify_soa_links (user_id, linked_at, last_entitlements, last_sync_at)
    VALUES (${userId}, NOW(), ${JSON.stringify(entitlements)}::jsonb, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      last_entitlements = EXCLUDED.last_entitlements,
      last_sync_at = NOW()
  `;
}

export async function recordSpotifySoaSync(userId: string, entitlements: string[]): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE spotify_soa_links
    SET last_entitlements = ${JSON.stringify(entitlements)}::jsonb, last_sync_at = NOW()
    WHERE user_id = ${userId}
  `;
}
