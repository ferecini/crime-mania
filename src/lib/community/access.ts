import { isEditorialUser } from "@/lib/admin/editorial-user-ids";
import type { SessionUser } from "@/lib/auth/session";
import { tierHasFeature } from "@/lib/plans";

export function canReadForum(session: SessionUser | null): boolean {
  return tierHasFeature(session?.tier ?? "none", "forum");
}

export function canWriteForum(session: SessionUser | null): boolean {
  return canReadForum(session);
}

export function canSuggestEpisode(session: SessionUser | null): boolean {
  return tierHasFeature(session?.tier ?? "none", "caseSuggestion");
}

export function isCommunityModerator(session: SessionUser | null): boolean {
  if (!session) return false;
  return isEditorialUser(session.id);
}

export function authorDisplayName(session: SessionUser): string {
  const name = session.displayName?.trim();
  if (name) return name;
  return "Membro";
}
