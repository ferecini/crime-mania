import bcrypt from "bcryptjs";
import type { AccountType } from "@/lib/auth/session";
import { DEMO_USER_ID } from "@/lib/auth/session";
import type { SubscriptionTier } from "@/lib/plans";
import {
  firstNameFromFullName,
  isValidPreferredName,
  resolveGreetingName,
  sanitizePreferredName,
} from "@/lib/auth/display-name";

export interface StoredUser {
  id: string;
  email: string;
  /** Nome completo interno (Google ou cadastro legado). */
  legalName: string;
  /** Nome escolhido para saudações na área logada. */
  preferredName?: string;
  /** Legado — espelha preferredName ou primeiro nome. */
  displayName: string;
  passwordHash: string;
  tier: SubscriptionTier;
  accountType: AccountType;
  isDemo: boolean;
  googleSub?: string;
  needsPreferredNameConfirm?: boolean;
}

/** Armazenamento em memória para desenvolvimento — substituir por banco em produção. */
const users = new Map<string, StoredUser>();

function syncDisplayName(user: StoredUser): void {
  user.displayName = resolveGreetingName({
    preferredName: user.preferredName,
    legalName: user.legalName,
  });
}

export async function findUserByEmail(
  email: string,
): Promise<StoredUser | undefined> {
  const normalized = email.trim().toLowerCase();
  return [...users.values()].find((u) => u.email === normalized);
}

export async function createEmailUser(input: {
  email: string;
  preferredName: string;
  password: string;
}): Promise<StoredUser> {
  const normalized = input.email.trim().toLowerCase();
  if (await findUserByEmail(normalized)) {
    throw new Error("E-mail já cadastrado.");
  }
  const preferredName = sanitizePreferredName(input.preferredName);
  if (!isValidPreferredName(preferredName)) {
    throw new Error("Nome de exibição inválido.");
  }
  const user: StoredUser = {
    id: crypto.randomUUID(),
    email: normalized,
    legalName: preferredName,
    preferredName,
    displayName: preferredName,
    passwordHash: await bcrypt.hash(input.password, 10),
    tier: "none",
    accountType: "standard",
    isDemo: false,
    needsPreferredNameConfirm: false,
  };
  syncDisplayName(user);
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

export function updatePreferredName(userId: string, preferredName: string): StoredUser {
  const user = users.get(userId);
  if (!user) throw new Error("Usuário não encontrado.");
  const clean = sanitizePreferredName(preferredName);
  if (!isValidPreferredName(clean)) throw new Error("Nome de exibição inválido.");
  user.preferredName = clean;
  user.needsPreferredNameConfirm = false;
  syncDisplayName(user);
  return user;
}

function findUserByGoogleSub(sub: string): StoredUser | undefined {
  return [...users.values()].find((u) => u.googleSub === sub);
}

/** Entrada ou cadastro via Google OAuth (e-mail verificado). */
export async function findOrCreateUserFromGoogle(profile: {
  sub: string;
  email: string;
  name: string;
}): Promise<StoredUser> {
  const bySub = findUserByGoogleSub(profile.sub);
  if (bySub) {
    if (profile.name && !bySub.legalName) bySub.legalName = profile.name;
    if (!bySub.preferredName?.trim()) {
      bySub.needsPreferredNameConfirm = true;
    }
    syncDisplayName(bySub);
    return bySub;
  }

  const existing = await findUserByEmail(profile.email);
  if (existing) {
    if (existing.isDemo) {
      throw new Error("Conta demo não pode ser vinculada ao Google.");
    }
    existing.googleSub = profile.sub;
    existing.legalName = existing.legalName || profile.name;
    if (!existing.preferredName?.trim()) {
      existing.needsPreferredNameConfirm = true;
    }
    syncDisplayName(existing);
    return existing;
  }

  const user: StoredUser = {
    id: crypto.randomUUID(),
    email: profile.email,
    legalName: profile.name,
    preferredName: undefined,
    displayName: firstNameFromFullName(profile.name),
    passwordHash: await bcrypt.hash(crypto.randomUUID(), 10),
    tier: "none",
    accountType: "standard",
    isDemo: false,
    googleSub: profile.sub,
    needsPreferredNameConfirm: true,
  };
  syncDisplayName(user);
  users.set(user.id, user);
  return user;
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
    legalName: "Conta de teste",
    preferredName: "Conta de teste",
    displayName: "Conta de teste",
    passwordHash: await bcrypt.hash("maniaco123", 10),
    tier: "none",
    accountType: "demo",
    isDemo: true,
  };
  users.set(user.id, user);
}

export function sessionPayloadFromUser(user: StoredUser) {
  return {
    id: user.id,
    email: user.email,
    displayName: resolveGreetingName(user),
    tier: user.tier,
    accountType: user.accountType,
    isDemo: user.isDemo,
    needsPreferredName: Boolean(user.needsPreferredNameConfirm && !user.preferredName?.trim()),
    needsPreferredNameConfirm: Boolean(user.needsPreferredNameConfirm),
  };
}
