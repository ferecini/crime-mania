import { randomUUID } from "crypto";
import { neon } from "@neondatabase/serverless";

const LIMITS = {
  upload: { max: 30, windowMs: 60 * 60 * 1000 },
  publish: { max: 20, windowMs: 60 * 60 * 1000 },
  delete: { max: 15, windowMs: 60 * 60 * 1000 },
} as const;

function sqlUrl(): string {
  const url = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("POSTGRES_URL é obrigatório.");
  return url;
}

export async function assertAdminRateLimit(
  actorId: string,
  action: keyof typeof LIMITS,
): Promise<void> {
  const { max, windowMs } = LIMITS[action];
  const sql = neon(sqlUrl());
  const since = new Date(Date.now() - windowMs).toISOString();
  const rows = await sql`
    SELECT COUNT(*)::int AS c FROM admin_rate_events
    WHERE actor_id = ${actorId} AND action = ${action} AND created_at >= ${since}::timestamptz
  `;
  const count = (rows[0]?.c as number) ?? 0;
  if (count >= max) {
    throw new Error("Limite de ações administrativas atingido. Tente mais tarde.");
  }
  await sql`
    INSERT INTO admin_rate_events (id, actor_id, action) VALUES (${randomUUID()}, ${actorId}, ${action})
  `;
}
