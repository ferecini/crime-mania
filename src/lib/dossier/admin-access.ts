import { timingSafeEqual } from "node:crypto";
import { isEditorialUser } from "@/lib/admin/editorial-user-ids";
import type { SessionUser } from "@/lib/auth/session";

export function isDossierAdmin(session: SessionUser | null): boolean {
  if (!session) return false;
  return isEditorialUser(session.id);
}

export function authorizeWorkerSecret(request: Request): boolean {
  const secret = process.env.CM_DOSSIER_WORKER_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (token.length !== secret.length) return false;
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(secret));
  } catch {
    return false;
  }
}
