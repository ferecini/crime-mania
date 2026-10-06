import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

/** Retorna o usuário da sessão atual (útil para obter `id` ao configurar CM_EDITORIAL_USER_IDS). */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  return NextResponse.json({
    user: {
      id: session.id,
      email: session.email,
      tier: session.tier,
      displayName: session.displayName,
    },
  });
}
