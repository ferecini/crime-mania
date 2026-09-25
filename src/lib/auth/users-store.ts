import bcrypt from "bcryptjs";
import type { AccountType } from "@/lib/auth/session";
import { DEMO_USER_ID } from "@/lib/auth/session";
import type { SubscriptionTier } from "@/lib/plans";

export interface StoredUser {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  tier: SubscriptionTier;
  accountType: AccountType;
  isDemo: boolean;
}

/** Armazenamento em memória para desenvolvimento — substituir por banco em produção. */
const users = new Map<string, StoredUser>();

export async function findUserByEmail(
  email: string,
): Promise<StoredUser | undefined> {
  const normalized = email.trim().toLowerCase();
  return [...users.values()].find((u) => u.email === normalized);
}

export async function createEmailUser(input: {
  email: string;
  displayName: string;
  password: string;
}): Promise<StoredUser> {
  const normalized = input.email.trim().toLowerCase();
  if (await findUserByEmail(normalized)) {
    throw new Error("E-mail já cadastrado.");
  }
  const user: StoredUser = {
    id: crypto.randomUUID(),
    email: normalized,
    displayName: input.displayName.trim(),
    passwordHash: await bcrypt.hash(input.password, 10),
    tier: "none",
    accountType: "standard",
    isDemo: false,
  };
  users.set(user.id, user);
  return user;
}

export async function validateEmailPassword(
  email: string,
  password: string,
): Promise<StoredUser | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : null;
}

export function getUserById(id: string): StoredUser | undefined {
  return users.get(id);
}

export function setUserTier(userId: string, tier: SubscriptionTier): void {
  const user = users.get(userId);
  if (user) user.tier = tier;
}

/** Apenas desenvolvimento local com ENABLE_DEMO_USER=true */
export async function ensureDemoUser(): Promise<void> {
  if (process.env.NODE_ENV === "production") return;
  if (process.env.ENABLE_DEMO_USER !== "true") return;
  const email = "demo@crimemania.com.br";
  if (await findUserByEmail(email)) return;
  const user: StoredUser = {
    id: DEMO_USER_ID,
    email,
    displayName: "Conta de teste",
    passwordHash: await bcrypt.hash("maniaco123", 10),
    tier: "none",
    accountType: "demo",
    isDemo: true,
  };
  users.set(user.id, user);
}
