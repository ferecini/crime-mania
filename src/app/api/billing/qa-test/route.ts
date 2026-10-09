import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { isCommercialPlanId } from "@/lib/billing/config";
import { canUseBillingQaTest, makeBillingQaResult } from "@/lib/billing/qa-test";
import { billingQaTestModeEnabled } from "@/lib/features";
import { assertSameOrigin } from "@/lib/http/same-origin";

const schema = z.object({ planId: z.string() });

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
  }
  if (!billingQaTestModeEnabled()) {
    return NextResponse.json({ error: "Teste de pagamento desativado." }, { status: 403 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  }
  if (!canUseBillingQaTest({ userId: session.id, isTestUser: session.isTestUser })) {
    return NextResponse.json({ error: "Teste restrito às contas de QA." }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success || !isCommercialPlanId(parsed.data.planId)) {
    return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
  }

  return NextResponse.json(makeBillingQaResult(parsed.data.planId), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
