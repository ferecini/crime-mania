import { hydrateUsersStore } from "@/lib/auth/users-store-hydrate";
import { getUserById } from "@/lib/auth/users-store";
import { firstNameFromFullName } from "@/lib/auth/display-name";

/** Nome público na comunidade — nunca e-mail ou id. */
export function displayNameForMemberId(userId: string): string {
  hydrateUsersStore();
  const user = getUserById(userId);
  if (!user) return "Membro";
  if (user.preferredName?.trim() && user.preferredNameConfirmedAt) {
    return user.preferredName.trim();
  }
  const fallback = user.displayName?.trim() || user.legalName?.trim();
  if (fallback) return firstNameFromFullName(fallback);
  return "Membro";
}
