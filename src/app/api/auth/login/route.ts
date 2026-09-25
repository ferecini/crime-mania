import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ensureDemoUser,
  validateEmailPassword,
} from "@/lib/auth/users-store";
import { COOKIE_NAME, createSessionToken } from "@/lib/auth/session";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  await ensureDemoUser();
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 400 });
  }

  const user = await validateEmailPassword(parsed.data.email, parsed.data.password);
  if (!user) {
    return NextResponse.json(
      { error: "Não foi possível entrar. Verifique e-mail e senha." },
      { status: 401 },
    );
  }
  if (process.env.NODE_ENV === "production" && user.isDemo) {
    return NextResponse.json(
      { error: "Conta de demonstração não disponível em produção." },
      { status: 403 },
    );
  }

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
}
