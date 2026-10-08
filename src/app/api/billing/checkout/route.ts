import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, createSessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { startBillingCheckout } from "@/lib/billing/checkout-service";
import { isCommercialPlanId } from "@/lib/billing/config";
import { billingEnabled } from "@/lib/features";

const schema = z.object({
  planId: z.string(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  }
  if (session.isTestUser) {
    return NextResponse.json(
      { error: "Contas de QA não usam checkout de cobrança." },
      { status: 403 },
    );
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success || !isCommercialPlanId(parsed.data.planId)) {
    return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
  }

  try {
    const checkout = await startBillingCheckout({
      userId: session.id,
      email: session.email,
      displayName: session.displayName,
      planId: parsed.data.planId,
    });

    const response = NextResponse.json({
      ok: true,
      billingUiEnabled: billingEnabled,
      ...checkout,
    });

    if (!billingEnabled) {
      return response;
    }

    const token = await createSessionToken(session);
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout indisponível.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
