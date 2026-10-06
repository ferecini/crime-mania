import type { StoredUser } from "@/lib/auth/users-store";
import {
  canPersistUsersToFile,
  loadTestUsersFromEnv,
  loadUsersFromFile,
  saveUsersToFile,
} from "@/lib/auth/users-persistence";

declare global {
  var __cmUsersStore: Map<string, StoredUser> | undefined;
  var __cmUsersHydrated: boolean | undefined;
}

export function getUsersMap(): Map<string, StoredUser> {
  if (!globalThis.__cmUsersStore) {
    globalThis.__cmUsersStore = new Map();
  }
  return globalThis.__cmUsersStore;
}

export function hydrateUsersStore(force = false): void {
  if (globalThis.__cmUsersHydrated && !force) return;
  const map = getUsersMap();
  map.clear();

  for (const user of loadUsersFromFile()) {
    map.set(user.id, user);
  }

  for (const user of loadTestUsersFromEnv()) {
    const existing = [...map.values()].find(
      (u) => u.email.toLowerCase() === user.email.toLowerCase(),
    );
    if (existing) map.delete(existing.id);
    map.set(user.id, user);
  }

  globalThis.__cmUsersHydrated = true;
}

export function persistUsersStore(): void {
  if (!canPersistUsersToFile()) return;
  saveUsersToFile(getUsersMap().values());
}

export function removeUsersByEmail(emails: string[]): number {
  hydrateUsersStore();
  const normalized = new Set(emails.map((e) => e.trim().toLowerCase()));
  const map = getUsersMap();
  let removed = 0;
  for (const [id, user] of [...map.entries()]) {
    if (normalized.has(user.email.toLowerCase())) {
      map.delete(id);
      removed += 1;
    }
  }
  persistUsersStore();
  return removed;
}
