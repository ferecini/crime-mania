import { NextResponse } from "next/server";
import { z } from "zod";
import { createEmailUser, findUserByEmail } from "@/lib/auth/users-store";
import { COOKIE_NAME, createSessionToken } from "@/lib/auth/session";

/**
 * Stub de login Google para desenvolvimento.
 * Integrar OAuth real (Google Identity) antes do go-live.
 */
const schema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2).max(80),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
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
