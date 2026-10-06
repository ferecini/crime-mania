/**
 * Remove contas de QA pelos e-mails em QA_*_EMAIL.
 * Uso: ALLOW_TEST_USERS=true npm run revoke:test-members
 */
import {
  allowTestUsersInRuntime,
  qaEmailEnvKey,
  type QaUserSlot,
} from "../src/lib/auth/qa-users";
import { revokeQaTestUsers } from "../src/lib/auth/users-store";

const SLOTS: QaUserSlot[] = ["free", "tier1", "tier2"];

async function main() {
  if (!allowTestUsersInRuntime()) {
    console.error("Defina ALLOW_TEST_USERS=true neste ambiente.");
    process.exit(1);
  }

  const emails = SLOTS.map((slot) => process.env[qaEmailEnvKey(slot)]?.trim()).filter(Boolean) as string[];

  if (!emails.length) {
    console.error("Nenhum QA_*_EMAIL definido — nada a revogar.");
    process.exit(1);
  }

  const removed = revokeQaTestUsers(emails);
  console.log(`[qa] Removidas ${removed} conta(s) para: ${emails.join(", ")}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
