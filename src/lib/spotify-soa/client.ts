import {
  SPOTIFY_SOA_API_BASE,
  SPOTIFY_SOA_MANAGE_SCOPE,
  SPOTIFY_SOA_TOKEN_URL,
  getSpotifySoaCredentials,
} from "@/lib/spotify-soa/config";
import { signSoaPayload } from "@/lib/spotify-soa/jwt";

const FETCH_TIMEOUT_MS = 10_000;

let cachedToken: { value: string; expiresAt: number } | null = null;

function basicAuthHeader(): string {
  const { clientId, clientSecret } = getSpotifySoaCredentials();
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
}

async function postForm(
  params: Record<string, string>,
): Promise<{ access_token: string; expires_in?: number }> {
  const res = await fetch(SPOTIFY_SOA_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Spotify token endpoint falhou (HTTP ${res.status}).`);
  }
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error("Spotify token endpoint sem access_token.");
  return { access_token: json.access_token, expires_in: json.expires_in };
}

/** Troca o authorization code (fluxo server-side com client secret, sem PKCE). */
export async function exchangeAuthorizationCode(
  code: string,
  redirectUri: string,
): Promise<string> {
  const { access_token } = await postForm({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });
  return access_token;
}

/** Token client-credentials (scope soa-manage-entitlements), com cache em memória. */
export async function getClientCredentialsToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 30_000) return cachedToken.value;
  const { access_token, expires_in } = await postForm({
    grant_type: "client_credentials",
    scope: SPOTIFY_SOA_MANAGE_SCOPE,
  });
  cachedToken = { value: access_token, expiresAt: now + (expires_in ?? 3600) * 1000 };
  return access_token;
}

export function clearSpotifySoaTokenCache(): void {
  cachedToken = null;
}

async function postSoa(path: string, bearer: string, jwt: string): Promise<Response> {
  const res = await fetch(`${SPOTIFY_SOA_API_BASE}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${bearer}`,
      "Content-Type": "application/jwt",
      Accept: "application/json",
    },
    body: jwt,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Spotify SOA ${path} falhou (HTTP ${res.status}).`);
  }
  return res;
}

/** POST register-user com o token do usuário; retorna completion_url. */
export async function registerUser(
  accessToken: string,
  partnerUserId: string,
  entitlements: string[],
): Promise<{ completionUrl: string }> {
  const { partnerId } = getSpotifySoaCredentials();
  const jwt = await signSoaPayload({
    partner_id: partnerId,
    partner_user_id: partnerUserId,
    entitlements,
  });
  const res = await postSoa("register-user", accessToken, jwt);
  const json = (await res.json()) as { completion_url?: string };
  if (!json.completion_url) throw new Error("Spotify SOA register-user sem completion_url.");
  return { completionUrl: json.completion_url };
}

/** POST replace-entitlements com token client-credentials. */
export async function replaceEntitlements(
  partnerUserId: string,
  entitlements: string[],
): Promise<void> {
  const { partnerId } = getSpotifySoaCredentials();
  const token = await getClientCredentialsToken();
  const jwt = await signSoaPayload({
    partner_id: partnerId,
    partner_user_id: partnerUserId,
    entitlements,
  });
  await postSoa("replace-entitlements", token, jwt);
}
