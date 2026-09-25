import { cookies } from "next/headers";

export const GOOGLE_OAUTH_COOKIE = "cm_google_oauth";

export interface GoogleOAuthCookiePayload {
  state: string;
  next: string;
}

export async function setGoogleOAuthCookie(payload: GoogleOAuthCookiePayload): Promise<void> {
  const store = await cookies();
  store.set(GOOGLE_OAUTH_COOKIE, JSON.stringify(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });
}

export async function readGoogleOAuthCookie(): Promise<GoogleOAuthCookiePayload | null> {
  const store = await cookies();
  const raw = store.get(GOOGLE_OAUTH_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as GoogleOAuthCookiePayload;
    if (!parsed.state || typeof parsed.next !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function clearGoogleOAuthCookie(): Promise<void> {
  const store = await cookies();
  store.delete(GOOGLE_OAUTH_COOKIE);
}

/** Evita open redirect: só paths internos. */
export function sanitizeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/membro";
  if (next.startsWith("/api/")) return "/membro";
  return next;
}
