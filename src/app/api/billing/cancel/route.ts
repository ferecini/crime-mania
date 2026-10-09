import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, createSessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { cancelBillingAtPeriodEnd } from "@/lib/billing/checkout-service";
import { syncUserTierFromBilling } from "@/lib/billing/tier-sync";

const schema = z.object({
  confirm: z.literal(true),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Confirme o cancelamento enviando confirm: true." },
      { status: 400 },
    );
  }

  try {
    await cancelBillingAtPeriodEnd(session.id);
    const tier = await syncUserTierFromBilling(session.id);
    const token = await createSessionToken({ ...session, tier });
    const response = NextResponse.json({
      ok: true,
      message: "Cancelamento agendado. Você mantém acesso até o fim do período pago.",
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
