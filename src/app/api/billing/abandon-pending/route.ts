import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, createSessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { abandonPendingCheckout } from "@/lib/billing/checkout-service";
import { syncUserTierFromBilling } from "@/lib/billing/tier-sync";
import { billingCheckoutEnabled } from "@/lib/features";
import { assertSameOrigin } from "@/lib/http/same-origin";

const schema = z.object({
  confirm: z.literal(true),
});

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
  }
  if (!billingCheckoutEnabled()) {
    return NextResponse.json(
      { error: "Gerenciamento de assinatura indisponível neste ambiente." },
      { status: 403 },
    );
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  }
  if (session.isTestUser) {
    return NextResponse.json(
      { error: "Contas de QA não usam cancelamento de cobrança." },
      { status: 403 },
    );
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Confirme enviando confirm: true." },
      { status: 400 },
    );
  }

  try {
    await abandonPendingCheckout(session.id);
    const tier = await syncUserTierFromBilling(session.id);
    const token = await createSessionToken({ ...session, tier });
    const response = NextResponse.json({
      ok: true,
      message: "Checkout pendente cancelado. Você pode escolher um plano novamente.",
      tier,
    });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Não foi possível cancelar.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
