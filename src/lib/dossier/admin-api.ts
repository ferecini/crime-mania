import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isDossierAdmin } from "@/lib/dossier/admin-access";

export async function requireDossierAdmin() {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Não autenticado." }, { status: 401 }) };
  }
  if (!isDossierAdmin(session)) {
    return { error: NextResponse.json({ error: "Não autorizado." }, { status: 403 }) };
  }
  return { session };
}

export function assertSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const requestHost = new URL(request.url).host;
    return new URL(origin).host === requestHost;
  } catch {
    return false;
  }
}
