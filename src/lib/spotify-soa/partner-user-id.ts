import { createHash } from "node:crypto";

/**
 * Spotify exige partner_user_id: hex minúsculo, 16–128 caracteres, sem PII.
 * @see https://developer.spotify.com/documentation/open-access/concepts
 */
export function spotifyPartnerUserId(crimeManiaUserId: string): string {
  const compact = crimeManiaUserId.replace(/-/g, "").toLowerCase();
  if (/^[0-9a-f]{16,128}$/.test(compact)) return compact;
  return createHash("sha256").update(crimeManiaUserId, "utf8").digest("hex");
}
