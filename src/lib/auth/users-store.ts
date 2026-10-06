import bcrypt from "bcryptjs";
import type { AccountType } from "@/lib/auth/session";
import { DEMO_USER_ID } from "@/lib/auth/session";
import type { SubscriptionTier } from "@/lib/plans";
import {
  firstNameFromFullName,
  isPreferredNameConfirmed,
  isValidPreferredName,
  resolveGreetingName,
  sanitizePreferredName,
  suggestedPreferredName,
} from "@/lib/auth/display-name";
import { migrateUserPreferredName } from "@/lib/auth/preferred-name-migration";
import type { QaUserSlot } from "@/lib/auth/qa-users";
import {
  QA_DEFAULT_TIERS,
  QA_DISPLAY_NAMES,
  QA_USER_IDS,
  allowTestUsersInRuntime,
} from "@/lib/auth/qa-users";
import {
  getUsersMap,
  hydrateUsersStore,
  persistUsersStore,
  removeUsersByEmail,
} from "@/lib/auth/users-store-hydrate";

export interface StoredUser {
  id: string;
  email: string;
  /** Nome completo interno (Google ou cadastro legado). */
  legalName: string;
  /** Nome escolhido para saudações na área logada (só usado após confirmação). */
  preferredName?: string;
  /** ISO — preenchido quando o usuário salva nome no onboarding ou perfil. */
  preferredNameConfirmedAt?: string;
  /** Legado — espelha saudação resolvida. */
  displayName: string;
  passwordHash: string;
  tier: SubscriptionTier;
  accountType: AccountType;
  isDemo: boolean;
  /** Conta de QA — não entra em métricas/cobrança; tier só via seed/admin. */
  isTestUser?: boolean;
  googleSub?: string;
  needsPreferredNameConfirm?: boolean;
}

function touchUser(user: StoredUser): StoredUser {
  migrateUserPreferredName(user);
  user.displayName = resolveGreetingName(user);
  return user;
}

function syncDisplayName(user: StoredUser): void {
  user.displayName = resolveGreetingName(user);
}

function saveUser(user: StoredUser): void {
  getUsersMap().set(user.id, user);
  persistUsersStore();
}

export async function findUserByEmail(
  email: string,
): Promise<StoredUser | undefined> {
  hydrateUsersStore();
  const normalized = email.trim().toLowerCase();
  const user = [...getUsersMap().values()].find((u) => u.email === normalized);
  return user ? touchUser(user) : undefined;
}

export async function createEmailUser(input: {
  email: string;
  preferredName: string;
  password: string;
}): Promise<StoredUser> {
  hydrateUsersStore();
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
    isTestUser: false,
    needsPreferredNameConfirm: false,
    preferredNameConfirmedAt: new Date().toISOString(),
  };
  syncDisplayName(user);
  saveUser(user);
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
  hydrateUsersStore();
  const user = getUsersMap().get(id);
  return user ? touchUser(user) : undefined;
}

/** Alteração de tier pelo usuário (checkout simulado) — bloqueada para contas de teste. */
export function setUserTier(userId: string, tier: SubscriptionTier): void {
  hydrateUsersStore();
  const user = getUsersMap().get(userId);
  if (!user) return;
  if (user.isTestUser) {
    throw new Error("Contas de QA não alteram plano pelo checkout.");
  }
  user.tier = tier;
  saveUser(user);
}

/** Atribuição administrativa de tier (seed QA). */
export function setUserTierAdmin(userId: string, tier: SubscriptionTier): void {
  hydrateUsersStore();
  const user = getUsersMap().get(userId);
  if (!user?.isTestUser) {
    throw new Error("setUserTierAdmin só se aplica a contas isTestUser.");
  }
  user.tier = tier;
  saveUser(user);
}

export function updatePreferredName(userId: string, preferredName: string): StoredUser {
  hydrateUsersStore();
  const user = getUsersMap().get(userId);
  if (!user) throw new Error("Usuário não encontrado.");
  const clean = sanitizePreferredName(preferredName);
  if (!isValidPreferredName(clean)) throw new Error("Nome de exibição inválido.");
  user.preferredName = clean;
  user.preferredNameConfirmedAt = new Date().toISOString();
  user.needsPreferredNameConfirm = false;
  syncDisplayName(user);
  saveUser(user);
  return user;
}

function findUserByGoogleSub(sub: string): StoredUser | undefined {
  return [...getUsersMap().values()].find((u) => u.googleSub === sub);
}

/** Entrada ou cadastro via Google OAuth (e-mail verificado). */
export async function findOrCreateUserFromGoogle(profile: {
  sub: string;
  email: string;
  name: string;
}): Promise<StoredUser> {
  hydrateUsersStore();
  const emailNorm = profile.email.trim().toLowerCase();
  const existingEmail = await findUserByEmail(emailNorm);
  if (existingEmail?.isTestUser) {
    throw new Error("Esta conta de QA usa login por e-mail e senha.");
  }

  const bySub = findUserByGoogleSub(profile.sub);
  if (bySub) {
    if (profile.name?.trim()) bySub.legalName = profile.name.trim();
    return touchUser(bySub);
  }

  const existing = existingEmail;
  if (existing) {
    if (existing.isDemo) {
      throw new Error("Conta demo não pode ser vinculada ao Google.");
    }
    existing.googleSub = profile.sub;
    existing.legalName = existing.legalName || profile.name;
    saveUser(existing);
    return touchUser(existing);
  }

  const user: StoredUser = {
    id: crypto.randomUUID(),
    email: emailNorm,
    legalName: profile.name,
    preferredName: undefined,
    displayName: firstNameFromFullName(profile.name),
    passwordHash: await bcrypt.hash(crypto.randomUUID(), 10),
    tier: "none",
    accountType: "standard",
    isDemo: false,
    isTestUser: false,
    googleSub: profile.sub,
    needsPreferredNameConfirm: true,
    preferredNameConfirmedAt: undefined,
  };
  touchUser(user);
  saveUser(user);
  return user;
}

export async function upsertQaTestUser(input: {
  slot: QaUserSlot;
  email: string;
  password: string;
  tier?: SubscriptionTier;
}): Promise<StoredUser> {
  if (!allowTestUsersInRuntime()) {
    throw new Error("ALLOW_TEST_USERS=true é obrigatório para contas de QA.");
  }
  hydrateUsersStore(true);
  const email = input.email.trim().toLowerCase();
  const preferredName = QA_DISPLAY_NAMES[input.slot];
  const tier = input.tier ?? QA_DEFAULT_TIERS[input.slot];
  const id = QA_USER_IDS[input.slot];

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user: StoredUser = {
    id,
    email,
    legalName: preferredName,
    preferredName,
    preferredNameConfirmedAt: new Date().toISOString(),
    displayName: preferredName,
    passwordHash,
    tier,
    accountType: "standard",
    isDemo: false,
    isTestUser: true,
    needsPreferredNameConfirm: false,
  };
  syncDisplayName(user);

  for (const [uid, u] of [...getUsersMap().entries()]) {
    if (uid !== id && u.email === email) getUsersMap().delete(uid);
  }
  saveUser(user);
  return user;
}

export function revokeQaTestUsers(emails: string[]): number {
  return removeUsersByEmail(emails);
}

/** Apenas desenvolvimento local com ENABLE_DEMO_USER=true */
export async function ensureDemoUser(): Promise<void> {
  if (process.env.NODE_ENV === "production") return;
  if (process.env.ENABLE_DEMO_USER !== "true") return;
  hydrateUsersStore();
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
    isTestUser: false,
    preferredNameConfirmedAt: new Date().toISOString(),
    needsPreferredNameConfirm: false,
  };
  saveUser(user);
}

export function sessionPayloadFromUser(user: StoredUser) {
  touchUser(user);
  const confirmed = isPreferredNameConfirmed(user);
  return {
    id: user.id,
    email: user.email,
    displayName: resolveGreetingName(user),
    tier: user.tier,
    accountType: user.accountType,
    isDemo: user.isDemo,
    isTestUser: Boolean(user.isTestUser),
    needsPreferredName: !confirmed,
    needsPreferredNameConfirm: !confirmed,
  };
}

export function preferredNameForForm(user: StoredUser): string {
  touchUser(user);
  return suggestedPreferredName(user);
}

export function listTestUserSummaries(): Array<{
  slot: string;
  id: string;
  email: string;
  tier: SubscriptionTier;
}> {
  hydrateUsersStore();
  return [...getUsersMap().values()]
    .filter((u) => u.isTestUser)
    .map((u) => ({
      slot: Object.entries(QA_USER_IDS).find(([, id]) => id === u.id)?.[0] ?? "custom",
      id: u.id,
      email: u.email,
      tier: u.tier,
    }));
}
