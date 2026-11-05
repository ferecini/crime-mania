import { getSiteUrl } from "@/lib/seo/site-url";

export const SPOTIFY_SOA_AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
export const SPOTIFY_SOA_TOKEN_URL = "https://accounts.spotify.com/api/token";
export const SPOTIFY_SOA_API_BASE = "https://open-access.spotify.com/api/v1";

export const SPOTIFY_SOA_LINK_SCOPE = "user-soa-link";
export const SPOTIFY_SOA_MANAGE_SCOPE = "soa-manage-entitlements";

export interface SpotifySoaCredentials {
  clientId: string;
  clientSecret: string;
  partnerId: string;
}

/** Feature flag do servidor — desligado por padrão. */
export function isSpotifySoaEnabled(): boolean {
  return process.env.SPOTIFY_SOA_ENABLED === "true";
}

/** Retorna credenciais completas ou null se algo estiver faltando. */
export function getSpotifySoaCredentialsOrNull(): SpotifySoaCredentials | null {
  const clientId = process.env.SPOTIFY_SOA_CLIENT_ID?.trim();
  const clientSecret = process.env.SPOTIFY_SOA_CLIENT_SECRET?.trim();
  const partnerId = process.env.SPOTIFY_SOA_PARTNER_ID?.trim();
  if (!clientId || !clientSecret || !partnerId) return null;
  return { clientId, clientSecret, partnerId };
}

export function getSpotifySoaCredentials(): SpotifySoaCredentials {
  const creds = getSpotifySoaCredentialsOrNull();
  if (!creds) {
    throw new Error(
      "Spotify SOA: defina SPOTIFY_SOA_CLIENT_ID, SPOTIFY_SOA_CLIENT_SECRET e SPOTIFY_SOA_PARTNER_ID.",
    );
  }
  return creds;
}

/** Habilitado E configurado (usado pela UI e pelas rotas). */
export function isSpotifySoaReady(): boolean {
  return isSpotifySoaEnabled() && getSpotifySoaCredentialsOrNull() !== null;
}

export function getSpotifySoaRedirectUri(): string {
  return `${getSiteUrl()}/api/spotify/soa/callback`;
}
