import { NextResponse } from "next/server";
import { z } from "zod";
import { createEmailUser, ensureDemoUser } from "@/lib/auth/users-store";
import { COOKIE_NAME, createSessionToken } from "@/lib/auth/session";

const schema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2).max(80),
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

  try {
    const user = await createEmailUser(parsed.data);
    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      tier: user.tier,
      provider: "email",
      accountType: user.accountType,
      isDemo: user.isDemo,
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
