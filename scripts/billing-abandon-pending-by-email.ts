/**
 * Remove assinaturas pending no Neon por e-mail do cliente (suporte / owner).
 *
 *   POSTGRES_URL=... npx tsx scripts/billing-abandon-pending-by-email.ts --email=user@example.com
 *   POSTGRES_URL=... npx tsx scripts/billing-abandon-pending-by-email.ts --email=user@example.com --dry-run
 */
import { neon } from "@neondatabase/serverless";

function parseArgs(): { email: string; dryRun: boolean } {
  const emailArg = process.argv.find((a) => a.startsWith("--email="));
  if (!emailArg) {
    console.error("Uso: --email=conta@exemplo.com [--dry-run]");
    process.exit(1);
  }
  return {
    email: emailArg.slice("--email=".length).trim().toLowerCase(),
    dryRun: process.argv.includes("--dry-run"),
  };
}

async function main() {
  const { email, dryRun } = parseArgs();
  const url = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
  if (!url) {
    console.error("POSTGRES_URL ou DATABASE_URL é obrigatório.");
    process.exit(1);
  }

  const sql = neon(url);
  const rows = await sql`
    SELECT bs.id, bs.user_id, bs.plan_id, bs.status, bs.created_at, bc.email
    FROM billing_subscriptions bs
    JOIN billing_customers bc ON bc.user_id = bs.user_id
    WHERE LOWER(bc.email) = ${email}
      AND bs.status = 'pending'
    ORDER BY bs.created_at DESC
  `;

  if (rows.length === 0) {
    console.log(`Nenhuma assinatura pending para ${email}.`);
    return;
  }

  console.log(JSON.stringify(rows, null, 2));
  if (dryRun) {
    console.log("dry-run — nada removido.");
    return;
  }

  for (const row of rows) {
    await sql`DELETE FROM billing_subscriptions WHERE id = ${row.id as string}`;
    console.log(`removido ${row.id as string}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
