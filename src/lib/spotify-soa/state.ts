import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SPOTIFY_SOA_STATE_COOKIE = "cm_spotify_soa";
const COOKIE_PATH = "/api/spotify/soa";

const secretKey = process.env.AUTH_SECRET ?? "crime-mania-dev-secret-change-in-production";
const encodedKey = new TextEncoder().encode(`spotify-soa:${secretKey}`);

/** Cria nonce + cookie assinado (HS256, 10 min) ligado ao userId. Retorna o valor de `state`. */
export async function setSpotifySoaStateCookie(userId: string): Promise<string> {
  const nonce = crypto.randomUUID();
  const token = await new SignJWT({ uid: userId, nonce })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(encodedKey);
  const store = await cookies();
  store.set(SPOTIFY_SOA_STATE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: COOKIE_PATH,
    maxAge: 60 * 10,
  });
  return nonce;
}

/** Valida cookie + state recebido + userId da sessão. Sempre limpa o cookie. */
export async function consumeSpotifySoaState(
  state: string | null,
  userId: string,
): Promise<boolean> {
  const store = await cookies();
  const raw = store.get(SPOTIFY_SOA_STATE_COOKIE)?.value;
  store.delete({ name: SPOTIFY_SOA_STATE_COOKIE, path: COOKIE_PATH });
  if (!raw || !state) return false;
  try {
    const { payload } = await jwtVerify(raw, encodedKey);
    return payload.nonce === state && payload.uid === userId;
  } catch {
    return false;
  }
}
