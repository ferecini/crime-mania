import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { SubscriptionTier } from "@/lib/plans";

export type AccountType = "standard" | "demo";

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  tier: SubscriptionTier;
  provider: "email" | "google";
  accountType?: AccountType;
  isDemo?: boolean;
  sessionVersion?: number;
}

/** Incrementar em deploy para invalidar tokens antigos (ex.: sessões demo legadas). */
export const SESSION_VERSION = Number(process.env.CM_SESSION_VERSION ?? "2");

/** ID reservado — nunca válido em produção. */
export const DEMO_USER_ID = "00000000-0000-4000-8000-crime00000001";

const COOKIE_NAME = "cm_session";
const secretKey = process.env.AUTH_SECRET ?? "crime-mania-dev-secret-change-in-production";
const encodedKey = new TextEncoder().encode(secretKey);

function isDemoSession(user: SessionUser): boolean {
  if (user.isDemo === true) return true;
  if (user.accountType === "demo") return true;
  if (user.id === DEMO_USER_ID) return true;
  if (user.email.trim().toLowerCase() === "demo@crimemania.com.br") return true;
  return false;
}

function sessionAllowedInEnvironment(user: SessionUser): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return !isDemoSession(user);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  const payload: SessionUser = {
    ...user,
    accountType: user.accountType ?? (user.isDemo ? "demo" : "standard"),
    isDemo: user.isDemo ?? user.accountType === "demo",
    sessionVersion: SESSION_VERSION,
  };
  return new SignJWT({ user: payload })
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
    if (!user) return null;
    if ((user.sessionVersion ?? 0) !== SESSION_VERSION) return null;
    if (!sessionAllowedInEnvironment(user)) return null;
    return user;
  } catch {
    return null;
  }
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const user = await verifySessionToken(token);
  if (!user) {
    cookieStore.delete(COOKIE_NAME);
    return null;
  }

  const { getUserById } = await import("@/lib/auth/users-store");
  const stored = getUserById(user.id);
  if (stored && stored.tier !== user.tier) {
    return { ...user, tier: stored.tier };
  }
  return user;
}

export { COOKIE_NAME };
