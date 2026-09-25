import { createRemoteJWKSet, jwtVerify } from "jose";
import { getGoogleClientId, getGoogleClientSecret } from "@/lib/auth/google-config";

const googleJwks = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export interface GoogleProfile {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture?: string;
}

export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
): Promise<{ idToken: string }> {
  const body = new URLSearchParams({
    code,
    client_id: getGoogleClientId(),
    client_secret: getGoogleClientSecret(),
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Falha ao trocar código Google: ${res.status} ${detail.slice(0, 200)}`);
  }

  const data = (await res.json()) as { id_token?: string };
  if (!data.id_token) throw new Error("Resposta Google sem id_token.");
  return { idToken: data.id_token };
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  const clientId = getGoogleClientId();
  const { payload } = await jwtVerify(idToken, googleJwks, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: clientId,
  });

  const sub = payload.sub;
  const email = payload.email;
  if (typeof sub !== "string" || typeof email !== "string") {
    throw new Error("Token Google inválido: sub ou e-mail ausente.");
  }

  const emailVerified = payload.email_verified === true;
  if (!emailVerified) {
    throw new Error("E-mail Google não verificado.");
  }

  const name =
    (typeof payload.name === "string" && payload.name.trim()) ||
    email.split("@")[0] ||
    "Membro";

  return {
    sub,
    email: email.trim().toLowerCase(),
    emailVerified,
    name: name.trim().slice(0, 80),
    picture: typeof payload.picture === "string" ? payload.picture : undefined,
  };
}
