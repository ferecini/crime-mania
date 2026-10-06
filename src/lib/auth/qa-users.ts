import type { SubscriptionTier } from "@/lib/plans";

export type QaUserSlot = "free" | "tier1" | "tier2" | "admin";

export const QA_USER_IDS: Record<QaUserSlot, string> = {
  free: "00000000-0000-4000-8000-010000000001",
  tier1: "00000000-0000-4000-8000-010000000002",
  tier2: "00000000-0000-4000-8000-010000000003",
  admin: "00000000-0000-4000-8000-010000000004",
};

export const QA_DISPLAY_NAMES: Record<QaUserSlot, string> = {
  free: "QA Sem plano",
  tier1: "QA Tier 1",
  tier2: "QA Tier 2",
  admin: "QA Admin editorial",
};

export const QA_DEFAULT_TIERS: Record<QaUserSlot, SubscriptionTier> = {
  free: "none",
  tier1: "tier1",
  tier2: "tier2",
  admin: "tier2",
};

export function allowTestUsersInRuntime(): boolean {
  return process.env.ALLOW_TEST_USERS === "true";
}

export function allowPlanSimulation(): boolean {
  return process.env.ALLOW_PLAN_SIMULATION === "true";
}

export function qaEmailEnvKey(slot: QaUserSlot): string {
  if (slot === "free") return "QA_FREE_EMAIL";
  if (slot === "tier1") return "QA_TIER1_EMAIL";
  if (slot === "tier2") return "QA_TIER2_EMAIL";
  return "QA_ADMIN_EMAIL";
}

export function qaPasswordEnvKey(slot: QaUserSlot): string {
  if (slot === "free") return "QA_FREE_PASSWORD";
  if (slot === "tier1") return "QA_TIER1_PASSWORD";
  if (slot === "tier2") return "QA_TIER2_PASSWORD";
  return "QA_ADMIN_PASSWORD";
}

export function maskSecret(value: string): string {
  const v = value.trim();
  if (!v) return "(vazio)";
  if (v.length <= 2) return "**";
  return `${v.slice(0, 1)}${"*".repeat(Math.min(v.length - 2, 12))}${v.slice(-1)} (len ${v.length})`;
}
