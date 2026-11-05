import { SignJWT } from "jose";
import { getSpotifySoaCredentials } from "@/lib/spotify-soa/config";

export interface SoaJwtPayload {
  partner_id: string;
  partner_user_id: string;
  entitlements: string[];
}

/** JWT HS256 assinado com o client secret (corpo de register-user / replace-entitlements). */
export async function signSoaPayload(
  payload: SoaJwtPayload,
  secret: string = getSpotifySoaCredentials().clientSecret,
): Promise<string> {
  return new SignJWT({
    partner_id: payload.partner_id,
    partner_user_id: payload.partner_user_id,
    entitlements: payload.entitlements,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(new TextEncoder().encode(secret));
}
