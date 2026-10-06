import { NextResponse } from "next/server";
import { z } from "zod";
import { COOKIE_NAME, createSessionToken, getSession } from "@/lib/auth/session";
import { sessionPayloadFromUser, updatePreferredName } from "@/lib/auth/users-store";

const schema = z.object({
  preferredName: z.string().min(1).max(80),
});

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Nome de exibição inválido." }, { status: 400 });
  }

  try {
    const user = updatePreferredName(session.id, parsed.data.preferredName);
    const token = await createSessionToken({
      ...sessionPayloadFromUser(user),
      provider: session.provider,
    });
    const response = NextResponse.json({ ok: true, displayName: user.displayName });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Não foi possível salvar.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
