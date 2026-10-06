import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getEpisodeSyncDiagnostics } from "@/lib/podcast/episode-catalog";

export async function POST(request: Request) {
  const secret = process.env.CM_ADMIN_SYNC_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "Sincronização administrativa não configurada." }, { status: 503 });
  }

  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (token !== secret) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  revalidateTag("crime-mania-public-episodes");
  revalidatePath("/");
  revalidatePath("/episodios");
  revalidatePath("/episodios/[slug]", "page");

  return NextResponse.json({
    ok: true,
    diagnostics: getEpisodeSyncDiagnostics(),
  });
}
