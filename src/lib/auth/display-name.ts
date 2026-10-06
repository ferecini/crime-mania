const INVALID = /[\u0000-\u001f<>{}\\]/;

export function sanitizePreferredName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, 80);
}

export function isValidPreferredName(raw: string): boolean {
  const value = sanitizePreferredName(raw);
  if (value.length < 1 || value.length > 80) return false;
  return !INVALID.test(value);
}

export function firstNameFromFullName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "Maníaco";
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

export function isPreferredNameConfirmed(input: {
  preferredNameConfirmedAt?: string | null;
}): boolean {
  return Boolean(input.preferredNameConfirmedAt?.trim());
}

/** Nome sugerido no onboarding/perfil enquanto não houver confirmação explícita. */
export function suggestedPreferredName(input: {
  preferredName?: string | null;
  legalName?: string | null;
  preferredNameConfirmedAt?: string | null;
}): string {
  if (isPreferredNameConfirmed(input)) {
    return input.preferredName?.trim() || firstNameFromFullName(input.legalName ?? "");
  }
  return firstNameFromFullName(input.legalName ?? input.preferredName ?? "");
}

export function resolveGreetingName(input: {
  preferredName?: string | null;
  legalName?: string | null;
  displayName?: string | null;
  preferredNameConfirmedAt?: string | null;
}): string {
  const preferred = input.preferredName?.trim();
  if (isPreferredNameConfirmed(input) && preferred) return preferred;

  const legal = input.legalName?.trim();
  if (legal) return firstNameFromFullName(legal);
  if (preferred) return firstNameFromFullName(preferred);
  const legacy = input.displayName?.trim();
  if (legacy) return firstNameFromFullName(legacy);
  return "Maníaco";
}
