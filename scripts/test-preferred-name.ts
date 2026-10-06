/**
 * Cenários de nome de exibição — rodar: npx --yes tsx scripts/test-preferred-name.ts
 */
import assert from "node:assert/strict";
import {
  isPreferredNameConfirmed,
  resolveGreetingName,
  suggestedPreferredName,
} from "../src/lib/auth/display-name";
import { migrateUserPreferredName } from "../src/lib/auth/preferred-name-migration";
import { mergeStoredUserWithSession, type StoredUser } from "../src/lib/auth/users-store";

function legacyGoogle(full: string): StoredUser {
  return {
    id: "1",
    email: "a@example.com",
    legalName: full,
    preferredName: full,
    displayName: full,
    passwordHash: "",
    tier: "none",
    accountType: "standard",
    isDemo: false,
    googleSub: "google-sub",
    needsPreferredNameConfirm: false,
  };
}

function assertGreeting(user: StoredUser, expected: string) {
  migrateUserPreferredName(user);
  assert.equal(resolveGreetingName(user), expected);
}

assertGreeting(legacyGoogle("Angelo Ferecini Silva"), "Angelo");

const legacy = legacyGoogle("Angelo Ferecini");
migrateUserPreferredName(legacy);
assert.equal(isPreferredNameConfirmed(legacy), false);
assert.equal(suggestedPreferredName(legacy), "Angelo");
assert.equal(legacy.preferredName, undefined);

const emailUser: StoredUser = {
  ...legacyGoogle("Rafa"),
  googleSub: undefined,
  preferredName: "Rafa",
  needsPreferredNameConfirm: false,
};
migrateUserPreferredName(emailUser);
assert.equal(isPreferredNameConfirmed(emailUser), true);
assert.equal(resolveGreetingName(emailUser), "Rafa");

const confirmedGoogle: StoredUser = {
  ...legacyGoogle("Angelo Ferecini"),
  preferredName: "Angelo",
  preferredNameConfirmedAt: new Date().toISOString(),
  needsPreferredNameConfirm: false,
};
assert.equal(resolveGreetingName(confirmedGoogle), "Angelo");
assert.equal(isPreferredNameConfirmed(confirmedGoogle), true);

const newGoogle: StoredUser = {
  ...legacyGoogle("Angelo Ferecini"),
  preferredName: undefined,
  needsPreferredNameConfirm: true,
};
assertGreeting(newGoogle, "Angelo");

const qaSeed: StoredUser = {
  id: "00000000-0000-4000-8000-010000000004",
  email: "qa-admin@crime-mania.test",
  legalName: "QA Admin editorial",
  preferredName: "QA Admin editorial",
  preferredNameConfirmedAt: "2020-01-01T00:00:00.000Z",
  displayName: "QA",
  passwordHash: "x",
  tier: "tier2",
  accountType: "standard",
  isDemo: false,
  isTestUser: true,
};
const merged = mergeStoredUserWithSession(qaSeed, {
  preferredName: "Maria",
  preferredNameConfirmedAt: "2026-10-06T20:00:00.000Z",
});
assert.equal(resolveGreetingName(merged), "Maria");

console.log("preferred-name: all scenarios OK");
