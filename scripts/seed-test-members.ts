/**
 * Cria/atualiza contas de QA (idempotente).
 * Uso: ALLOW_TEST_USERS=true QA_*_EMAIL=... QA_*_PASSWORD=... npm run seed:test-members
 * Vercel: npm run seed:test-members -- --emit-vercel-json  (copiar saída para CM_TEST_USERS_JSON)
 */
import {
  QA_DEFAULT_TIERS,
  QA_USER_IDS,
  allowTestUsersInRuntime,
  maskSecret,
  qaEmailEnvKey,
  qaPasswordEnvKey,
  type QaUserSlot,
} from "../src/lib/auth/qa-users";
import {
  listTestUserSummaries,
  upsertQaTestUser,
  type StoredUser,
} from "../src/lib/auth/users-store";
import type { SubscriptionTier } from "../src/lib/plans";

const SLOTS: QaUserSlot[] = ["free", "tier1", "tier2"];

function readTierOverride(slot: QaUserSlot): SubscriptionTier | undefined {
  const key = `QA_${slot.toUpperCase()}_TIER`;
  const raw = process.env[key]?.trim();
  if (!raw) return undefined;
  if (raw === "none" || raw === "tier1" || raw === "tier2") return raw;
  throw new Error(`${key} inválido: use none, tier1 ou tier2.`);
}

function parseArgs(): { emitVercelJson: boolean; only?: QaUserSlot } {
  const args = process.argv.slice(2);
  let emitVercelJson = false;
  let only: QaUserSlot | undefined;
  for (const arg of args) {
    if (arg === "--emit-vercel-json") emitVercelJson = true;
    if (arg.startsWith("--only=")) {
      const v = arg.slice("--only=".length) as QaUserSlot;
      if (!SLOTS.includes(v)) throw new Error(`--only inválido: ${v}`);
      only = v;
    }
  }
  return { emitVercelJson, only };
}

function toExportRecord(user: StoredUser): StoredUser {
  return {
    id: user.id,
    email: user.email,
    legalName: user.legalName,
    preferredName: user.preferredName,
    preferredNameConfirmedAt: user.preferredNameConfirmedAt,
    displayName: user.displayName,
    passwordHash: user.passwordHash,
    tier: user.tier,
    accountType: user.accountType,
    isDemo: user.isDemo,
    isTestUser: user.isTestUser,
    needsPreferredNameConfirm: user.needsPreferredNameConfirm,
  };
}

async function main() {
  if (!allowTestUsersInRuntime()) {
    console.error("Defina ALLOW_TEST_USERS=true neste ambiente.");
    process.exit(1);
  }

  const { emitVercelJson, only } = parseArgs();
  const targets = only ? [only] : SLOTS;

  for (const slot of targets) {
    const email = process.env[qaEmailEnvKey(slot)]?.trim();
    const password = process.env[qaPasswordEnvKey(slot)]?.trim();
    if (!email) {
      console.error(`Variável ${qaEmailEnvKey(slot)} é obrigatória.`);
      process.exit(1);
    }
    if (!password) {
      console.error(`Variável ${qaPasswordEnvKey(slot)} é obrigatória.`);
      process.exit(1);
    }
    const tier = readTierOverride(slot) ?? QA_DEFAULT_TIERS[slot];
    await upsertQaTestUser({ slot, email, password, tier });
    console.log(
      `[qa] ${slot}: id=${QA_USER_IDS[slot]} email=${email} tier=${tier} senha=${maskSecret(password)}`,
    );
  }

  const summaries = listTestUserSummaries();
  console.log("[qa] Contas ativas:", JSON.stringify(summaries, null, 2));

  if (emitVercelJson) {
    const { hydrateUsersStore } = await import("../src/lib/auth/users-store-hydrate");
    const { getUsersMap } = await import("../src/lib/auth/users-store-hydrate");
    hydrateUsersStore(true);
    const exportable = [...getUsersMap().values()]
      .filter((u) => u.isTestUser)
      .map(toExportRecord);
    console.log("\n# Cole em CM_TEST_USERS_JSON (Preview/Prod com ALLOW_TEST_USERS=true):\n");
    console.log(JSON.stringify(exportable));
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
