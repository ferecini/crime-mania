import bcrypt from "bcryptjs";
import type { SubscriptionTier } from "@/lib/plans";

export interface StoredUser {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  tier: SubscriptionTier;
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

/** Conta demo para testes locais (senha: maniaco123) */
export async function ensureDemoUser(): Promise<void> {
  const email = "demo@crimemania.com.br";
  if (await findUserByEmail(email)) return;
  await createEmailUser({
    email,
    displayName: "Crime Maníaco Demo",
    password: "maniaco123",
  });
}
