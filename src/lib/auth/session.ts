import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { SubscriptionTier } from "@/lib/plans";

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  tier: SubscriptionTier;
  provider: "email" | "google";
}

const COOKIE_NAME = "cm_session";
const secretKey = process.env.AUTH_SECRET ?? "crime-mania-dev-secret-change-in-production";
const encodedKey = new TextEncoder().encode(secretKey);

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function verifySessionToken(
  token: string,
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey);
    const user = payload.user as SessionUser | undefined;
    return user ?? null;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const user = await verifySessionToken(token);
  if (!user) return null;

  const { getUserById } = await import("@/lib/auth/users-store");
  const stored = getUserById(user.id);
  if (stored && stored.tier !== user.tier) {
    return { ...user, tier: stored.tier };
  }
  return user;
}

export { COOKIE_NAME };
