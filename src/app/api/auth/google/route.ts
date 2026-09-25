import { NextResponse } from "next/server";
import {
  buildGoogleAuthorizationUrl,
  getGoogleRedirectUri,
  isGoogleAuthConfigured,
} from "@/lib/auth/google-config";
import {
  sanitizeNextPath,
  setGoogleOAuthCookie,
} from "@/lib/auth/google-oauth-cookie";

export async function GET(request: Request) {
  if (!isGoogleAuthConfigured()) {
    return NextResponse.redirect(
      new URL("/entrar?error=google_indisponivel", request.url),
    );
  }

  const { searchParams } = new URL(request.url);
  const next = sanitizeNextPath(searchParams.get("next"));
  const state = crypto.randomUUID();

  await setGoogleOAuthCookie({ state, next });

  const redirectUri = getGoogleRedirectUri(request);
  const authUrl = buildGoogleAuthorizationUrl({ redirectUri, state });

  return NextResponse.redirect(authUrl);
}
