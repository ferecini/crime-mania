import {
  firstNameFromFullName,
  isPreferredNameConfirmed,
  sanitizePreferredName,
} from "@/lib/auth/display-name";
export type PreferredNameUserFields = {
  googleSub?: string;
  legalName: string;
  preferredName?: string;
  needsPreferredNameConfirm?: boolean;
  preferredNameConfirmedAt?: string;
};

const LEGACY_EMAIL_CONFIRMED_AT = "2000-01-01T00:00:00.000Z";

function namesMatch(a: string, b: string): boolean {
  return sanitizePreferredName(a).toLowerCase() === sanitizePreferredName(b).toLowerCase();
}

function looksLikeFullLegalName(preferredName: string, legalName: string): boolean {
  const preferred = sanitizePreferredName(preferredName);
  const legal = sanitizePreferredName(legalName);
  if (!preferred || !legal) return false;
  if (namesMatch(preferred, legal)) return true;
  const parts = preferred.split(/\s+/);
  return parts.length > 1 && legal.toLowerCase().includes(preferred.toLowerCase());
}

/**
 * Contas Google (ou legado) que tinham nome completo em `preferredName` sem confirmação
 * passam a exigir confirmação e usam só o primeiro nome na saudação.
 */
export function migrateUserPreferredName(user: PreferredNameUserFields): boolean {
  if (isPreferredNameConfirmed(user)) return false;

  let changed = false;

  const emailSelfChosen =
    !user.googleSub &&
    Boolean(user.preferredName?.trim()) &&
    user.needsPreferredNameConfirm !== true;

  if (emailSelfChosen) {
    user.preferredNameConfirmedAt = user.preferredNameConfirmedAt ?? LEGACY_EMAIL_CONFIRMED_AT;
    user.needsPreferredNameConfirm = false;
    return true;
  }

  if (user.googleSub) {
    user.needsPreferredNameConfirm = true;
    changed = true;

    const preferred = user.preferredName?.trim();
    const legal = user.legalName?.trim() ?? "";
    if (
      preferred &&
      (looksLikeFullLegalName(preferred, legal) || preferred.split(/\s+/).length > 1)
    ) {
      user.preferredName = undefined;
      changed = true;
    }
  }

  if (!user.googleSub && !user.preferredName?.trim()) {
    user.needsPreferredNameConfirm = true;
    changed = true;
  }

  return changed;
}

export function onboardingRequired(user: PreferredNameUserFields): boolean {
  migrateUserPreferredName(user);
  return !isPreferredNameConfirmed(user);
}

export { LEGACY_EMAIL_CONFIRMED_AT, firstNameFromFullName };
