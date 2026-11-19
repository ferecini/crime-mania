import { getSiteUrl } from "@/lib/seo/site-url";

const SCOPES = ["openid", "email", "profile"].join(" ");

export function isGoogleAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim(),
  );
}

export function getGoogleClientId(): string {
  const id = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!id) throw new Error("GOOGLE_CLIENT_ID não configurado.");
  return id;
}

export function getGoogleClientSecret(): string {
  const secret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!secret) throw new Error("GOOGLE_CLIENT_SECRET não configurado.");
  return secret;
}

/** URI exata cadastrada no Google Cloud Console (Authorized redirect URIs). */
export function getGoogleRedirectUri(request: Request): string {
  const configured = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") {
    return `${getSiteUrl()}/api/auth/google/callback`;
  }
  const origin = new URL(request.url).origin;
  return `${origin}/api/auth/google/callback`;
}

export function buildGoogleAuthorizationUrl(params: {
  redirectUri: string;
  state: string;
}): string {
  const clientId = getGoogleClientId();
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("state", params.state);
  url.searchParams.set("access_type", "online");
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}
