import fs from "node:fs";
import path from "node:path";
import type { StoredUser } from "@/lib/auth/users-store";

const DEFAULT_STORE_PATH = path.join(process.cwd(), "private", "data", "users-store.json");

export function usersStoreFilePath(): string {
  return process.env.CM_USERS_STORE_PATH?.trim() || DEFAULT_STORE_PATH;
}

export function canPersistUsersToFile(): boolean {
  if (process.env.CM_USERS_DISABLE_FILE_PERSIST === "true") return false;
  if (process.env.VERCEL === "1" && process.env.CM_USERS_PERSIST_ON_VERCEL !== "true") {
    return false;
  }
  return true;
}

export function loadUsersFromFile(): StoredUser[] {
  const filePath = usersStoreFilePath();
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw) as StoredUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

export function saveUsersToFile(users: Iterable<StoredUser>): void {
  if (!canPersistUsersToFile()) return;
  const filePath = usersStoreFilePath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const list = [...users];
  fs.writeFileSync(filePath, `${JSON.stringify(list, null, 2)}\n`, { mode: 0o600 });
}

export function loadTestUsersFromEnv(): StoredUser[] {
  const raw = process.env.CM_TEST_USERS_JSON?.trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as StoredUser[];
    return Array.isArray(parsed) ? parsed.filter((u) => u.isTestUser) : [];
  } catch {
    console.error("[auth] CM_TEST_USERS_JSON inválido — ignorando.");
    return [];
  }
}
