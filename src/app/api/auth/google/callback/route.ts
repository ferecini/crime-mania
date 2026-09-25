import { NextResponse } from "next/server";
import { getGoogleRedirectUri, isGoogleAuthConfigured } from "@/lib/auth/google-config";
import {
  exchangeCodeForTokens,
  verifyGoogleIdToken,
} from "@/lib/auth/google-oauth";
import {
  clearGoogleOAuthCookie,
  readGoogleOAuthCookie,
  sanitizeNextPath,
} from "@/lib/auth/google-oauth-cookie";
import { findOrCreateUserFromGoogle } from "@/lib/auth/users-store";
import { COOKIE_NAME, createSessionToken } from "@/lib/auth/session";

function redirectWithError(request: Request, code: string): NextResponse {
  const url = new URL("/entrar", request.url);
  url.searchParams.set("error", code);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  if (!isGoogleAuthConfigured()) {
    return redirectWithError(request, "google_indisponivel");
  }

  const { searchParams } = new URL(request.url);
  const oauthError = searchParams.get("error");
  if (oauthError) {
    await clearGoogleOAuthCookie();
    return redirectWithError(request, oauthError === "access_denied" ? "google_cancelado" : "google_falhou");
  }

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const stored = await readGoogleOAuthCookie();
  await clearGoogleOAuthCookie();

  if (!code || !state || !stored || stored.state !== state) {
    return redirectWithError(request, "google_estado_invalido");
  }

  try {
    const redirectUri = getGoogleRedirectUri(request);
    const { idToken } = await exchangeCodeForTokens(code, redirectUri);
    const profile = await verifyGoogleIdToken(idToken);

    if (process.env.NODE_ENV === "production" && profile.email === "demo@crimemania.com.br") {
      return redirectWithError(request, "google_demo");
    }

    const user = await findOrCreateUserFromGoogle({
      sub: profile.sub,
      email: profile.email,
      name: profile.name,
    });

    if (process.env.NODE_ENV === "production" && user.isDemo) {
      return redirectWithError(request, "google_demo");
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

    const destination = sanitizeNextPath(stored.next);
    const response = NextResponse.redirect(new URL(destination, request.url));
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch {
    return redirectWithError(request, "google_falhou");
  }
}
