/**
 * Altera tier de slot QA sem trocar senha (ex.: downgrade Tier 2 → Tier 1).
 * Uso: ALLOW_TEST_USERS=true QA_TIER2_EMAIL=... npm run qa:set-tier -- tier2 tier1
 */
import { allowTestUsersInRuntime, QA_USER_IDS, type QaUserSlot } from "../src/lib/auth/qa-users";
import { getUserById, setUserTierAdmin } from "../src/lib/auth/users-store";
import type { SubscriptionTier } from "../src/lib/plans";

async function main() {
  if (!allowTestUsersInRuntime()) {
    console.error("Defina ALLOW_TEST_USERS=true.");
    process.exit(1);
  }

  const [, , slotRaw, tierRaw] = process.argv;
  const slot = slotRaw as QaUserSlot;
  const tier = tierRaw as SubscriptionTier;
  if (!["free", "tier1", "tier2", "admin"].includes(slot)) {
    console.error("Uso: npm run qa:set-tier -- <free|tier1|tier2|admin> <none|tier1|tier2>");
    process.exit(1);
  }
  if (!["none", "tier1", "tier2"].includes(tier)) {
    console.error("Tier inválido.");
    process.exit(1);
  }

  const id = QA_USER_IDS[slot];
  const user = getUserById(id);
  if (!user?.isTestUser) {
    console.error(`Conta QA ${slot} não encontrada — rode seed:test-members antes.`);
    process.exit(1);
  }

  setUserTierAdmin(id, tier);
  console.log(`[qa] ${slot} (${user.email}) → tier ${tier}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
