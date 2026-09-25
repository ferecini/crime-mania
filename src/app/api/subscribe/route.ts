import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { getUserById, setUserTier } from "@/lib/auth/users-store";
import type { PlanId } from "@/lib/plans";
import { PLANS } from "@/lib/plans";
import { COOKIE_NAME, createSessionToken } from "@/lib/auth/session";

const schema = z.object({
  planId: z.enum(["tier1-monthly", "tier2-monthly", "tier2-annual"]),
});

/** Simula confirmação de pagamento — integrar gateway antes do go-live. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
  }

  const plan = PLANS.find((p) => p.id === parsed.data.planId);
  if (!plan) {
    return NextResponse.json({ error: "Plano não encontrado." }, { status: 404 });
  }

  const stored = getUserById(session.id);
  if (!stored) {
    return NextResponse.json({ error: "Conta não encontrada." }, { status: 404 });
  }

  setUserTier(session.id, plan.tier);

  const token = await createSessionToken({
    ...session,
    tier: plan.tier,
  });

  const response = NextResponse.json({
    ok: true,
    planId: plan.id as PlanId,
    tier: plan.tier,
    message:
      "Assinatura simulada com sucesso. Substitua este endpoint pelo webhook do provedor de pagamentos.",
  });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
