import { NextResponse } from "next/server";
import { checkAsaasConnection } from "@/lib/billing/asaas-provider";
import { requireDossierAdmin } from "@/lib/dossier/admin-api";

export async function GET() {
  const auth = await requireDossierAdmin();
  if (auth.error) return auth.error;

  try {
    const result = await checkAsaasConnection();
    return NextResponse.json(result, {
      status: result.ok ? 200 : 503,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json(
      { ok: false, status: 0, environment: "unavailable" },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
