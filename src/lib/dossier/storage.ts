import fs from "node:fs";
import path from "node:path";

export type DossierStorage = {
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
};

function localRoot(): string {
  return process.env.CM_DOSSIER_STORE_PATH ?? path.join(process.cwd(), "private");
}

function assertKey(key: string): string {
  const normalized = key.replace(/^\/+/, "").replace(/\\/g, "/");
  if (normalized.includes("..") || normalized.startsWith("/")) {
    throw new Error("Chave de armazenamento inválida.");
  }
  return normalized;
}

export function createLocalDossierStorage(): DossierStorage {
  return {
    async put(key, data, _contentType) {
      const k = assertKey(key);
      const abs = path.join(localRoot(), k);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, data, { mode: 0o600 });
    },
    async get(key) {
      const k = assertKey(key);
      const abs = path.join(localRoot(), k);
      try {
        return fs.readFileSync(abs);
      } catch {
        return null;
      }
    },
    async delete(key) {
      const k = assertKey(key);
      const abs = path.join(localRoot(), k);
      try {
        fs.unlinkSync(abs);
      } catch {
        /* ignore */
      }
    },
  };
}

export async function createDossierStorage(): Promise<DossierStorage> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (token) {
    const { put, del, get } = await import("@vercel/blob");
    return {
      async put(key, data, contentType) {
        const k = assertKey(key);
        await put(k, data, { access: "private", token, contentType, addRandomSuffix: false });
      },
      async get(key) {
        const k = assertKey(key);
        try {
          const result = await get(k, { access: "private", token });
          if (!result || result.statusCode !== 200) return null;
          const reader = result.stream.getReader();
          const chunks: Uint8Array[] = [];
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) chunks.push(value);
          }
          return Buffer.concat(chunks.map((c) => Buffer.from(c)));
        } catch {
          return null;
        }
      },
      async delete(key) {
        const k = assertKey(key);
        await del(k, { token });
      },
    };
  }
  return createLocalDossierStorage();
}

/** @deprecated use storage.get — compat local paths */
export function resolvePrivateStorageKey(storageKey: string): string {
  return path.join(localRoot(), assertKey(storageKey));
}
