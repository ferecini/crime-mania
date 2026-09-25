import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  planId: z.enum(["tier1-monthly", "tier2-monthly", "tier2-annual"]),
});

/** Registro simples em log até integração CRM/e-mail — não expor dados na UI. */
export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
  }
  console.info("[waitlist]", parsed.data.planId, parsed.data.email.toLowerCase());
  return NextResponse.json({ ok: true });
}
