/**
 * Lista de user ids com acesso editorial (dossiê admin + moderação comunidade).
 *
 * Preferência: CM_EDITORIAL_USER_IDS (lista única).
 * Fallback: união de CM_DOSSIER_ADMIN_IDS e CM_COMMUNITY_MODERATOR_IDS (legado).
 */
export function parseEditorialUserIds(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function getEditorialUserIds(): string[] {
  const primary = process.env.CM_EDITORIAL_USER_IDS?.trim();
  if (primary) {
    return parseEditorialUserIds(primary);
  }
  const merged = new Set<string>([
    ...parseEditorialUserIds(process.env.CM_DOSSIER_ADMIN_IDS),
    ...parseEditorialUserIds(process.env.CM_COMMUNITY_MODERATOR_IDS),
  ]);
  return [...merged];
}

export function isEditorialUser(sessionId: string | undefined | null): boolean {
  if (!sessionId) return false;
  return getEditorialUserIds().includes(sessionId);
}
