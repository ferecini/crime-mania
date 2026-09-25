import { NextResponse } from "next/server";
import { z } from "zod";
import { createEmailUser, findUserByEmail } from "@/lib/auth/users-store";
import { COOKIE_NAME, createSessionToken } from "@/lib/auth/session";
import { googleAuthEnabled } from "@/lib/features";

const schema = z.object({
  email: z.string().email().optional(),
  displayName: z.string().min(2).max(80).optional(),
});

export async function POST(request: Request) {
  if (!googleAuthEnabled) {
    return NextResponse.json(
      { error: "Entrada com Google indisponível no momento." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success || !parsed.data.email || !parsed.data.displayName) {
    return NextResponse.json(
      { error: "Fluxo Google incompleto. Use e-mail e senha." },
      { status: 400 },
    );
  }

  let user = await findUserByEmail(parsed.data.email);
  if (!user) {
    user = await createEmailUser({
      email: parsed.data.email,
      displayName: parsed.data.displayName,
      password: crypto.randomUUID(),
    });
  }

  const token = await createSessionToken({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    tier: user.tier,
    provider: "google",
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
