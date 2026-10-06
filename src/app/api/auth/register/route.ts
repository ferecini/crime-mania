import { NextResponse } from "next/server";
import { z } from "zod";
import { createEmailUser, ensureDemoUser, sessionPayloadFromUser } from "@/lib/auth/users-store";
import { COOKIE_NAME, createSessionToken } from "@/lib/auth/session";

const schema = z.object({
  email: z.string().email(),
  preferredName: z.string().min(1).max(80).optional(),
  displayName: z.string().min(1).max(80).optional(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  await ensureDemoUser();
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos. Verifique e-mail, nome e senha (mín. 8 caracteres)." },
      { status: 400 },
    );
  }

  const preferredName = parsed.data.preferredName ?? parsed.data.displayName;
  if (!preferredName) {
    return NextResponse.json({ error: "Informe como deseja ser chamado." }, { status: 400 });
  }

  try {
    const user = await createEmailUser({ ...parsed.data, preferredName });
    const token = await createSessionToken({
      ...sessionPayloadFromUser(user),
      provider: "email",
    });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao cadastrar.";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
